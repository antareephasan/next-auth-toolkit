"use server";

import { z } from "zod";
import bcrypt from 'bcryptjs';
import { NewPassowrdSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";

export const newPassword = async (
    values: z.infer<typeof NewPassowrdSchema>,
    token: string | null,
) => {
    try {
        if (!token) {
            return { error: "Missing token!" }
        }
        const validatedFields = NewPassowrdSchema.safeParse(values);

        if (!validatedFields.success) {
            return { error: "Invalid password!" }
        }

        const { password } = validatedFields.data

        const existingToken = await getPasswordResetTokenByToken(token);

        if (!existingToken) {
            return { error: "Invalid token!" }
        }

        const hasExpired = new Date(existingToken.expires) < new Date();

        if(hasExpired) {
            return { error: "Token Expired!" }
        }

        const existingUser = await getUserByEmail(existingToken.email);

        if(!existingUser) {
            return { error: "Email does not exist!" }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Changing the password i DB
        await db.user.update({
            where: {
                id: existingUser.id
            },
            data: {
                password: hashedPassword
            }
        });

        // Deleteig the token after password reset is done
        await db.passwordResetToken.delete({
            where: {
                id: existingToken?.id
            }
        });

        return { success: "Password updated!" }

    } catch (error) {
        return { error: "Failed to reset password!" }
    }
}