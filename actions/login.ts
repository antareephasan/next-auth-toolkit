"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";


export const login = async (
    values: z.infer<typeof LoginSchema>,
) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    if (!existingUser || !existingUser.email) {
        return { error: "No account found with this email address" }
    };

    if (!existingUser.password) {
        return { error: "Account created with different provider!" }
    }


    // if (!existingUser.emailVerified) {
    //     const verificationToken = await generateVerificationToken(
    //         existingUser.email,
    //     );

    //     await sendVerificationEmail(
    //         verificationToken.email,
    //         verificationToken.token,
    //     );

    //     return { success: "Confirmation Email sent!" }
    // }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT,
        })

    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials" }
                case "AuthorizedCallbackError":
                    return { success: "Confirmation Email sent! Please confirm to continue." }
                default:
                    return { error: "Something went wrong!" }
            }
        }
        throw error;
    }
};


