"use server";

import { RegisterSchema } from "@/schemas";
import { z } from "zod";
import bcrypt from 'bcryptjs';
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const register = async (values: z.infer<typeof RegisterSchema>) => {

    // Validating data
    const validatedFields = RegisterSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { name, email, password } = validatedFields.data;

    // Checking existing user
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
        return { error: "Email already in use!" }
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Storing the new user data in database
    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });


    const verifationToken = await generateVerificationToken(email);
    await sendVerificationEmail(
        verifationToken.email,
        verifationToken.token
    );
    return { success: "Confirmation Email sent!" };
}