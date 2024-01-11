"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { update } from "@/auth";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (
    values: z.infer<typeof SettingsSchema>
) => {
    //  CHECK IF USER EXISTS
    const user = await currentUser(); //Server user

    if (!user) {
        return { error: "Unauthorized" }
    }

    // CHECK IF USER ALSO EXISTS ON DB
    const dbUser = await getUserById(user.id);

    if (!dbUser) {
        return { error: "Unauthorized" }
    }

    // CHECK IF USER IS OAUTH OR NOT
    if (user.isOAuth) {
        values.email = undefined;
        values.password = undefined;
        values.newPassword = undefined;
        values.isTwoFactorEnabled = undefined;
    }

    // CHECK IF NEW PASSWORD EXISTS ON FORM VALUES
    if (values.password && values.newPassword && dbUser.password) {
        // IF CURRENT PASSWORD MATCHES OR NOT
        const passwordMatch = await bcrypt.compare(
            values.password,
            dbUser.password
        );

        if (!passwordMatch) {
            return { error: "Incorrect password!" }
        }

        // HASH THE NEW PASSWORD
        const hashedPassword = await bcrypt.hash(
            values.newPassword,
            10
        );
        values.password = hashedPassword;
        values.newPassword = undefined;
    }

    // CHECK IF USER EMAIL IS NEW OR THE OLD ONE
    if (values.email && values.email !== user.email) {
        const existingUser = await getUserByEmail(values.email);
        if (existingUser && existingUser.id !== user.id) {
            return { error: "Email already in use!" }
        }
        // CREATE NEW EMAIL VERIFICATION TOKEN 
        const verificationToken = await generateVerificationToken(values.email);

        // SEND EMAIL VERIFICATION TOKEN   
        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
        );

        return { success: "Verification email sent!" }
    }
    
    // UPDATE THE USER WITH THE NEW DATA
    const updatedUser = await db.user.update({
        where: { id: dbUser.id },
        data: {
            ...values,
        }
    });

    update({
        user: {
            name: updatedUser.name,
            email: updatedUser.email,
            isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
            role: updatedUser.role
        }
    })

    return { success: "Settings Updated!" }

}