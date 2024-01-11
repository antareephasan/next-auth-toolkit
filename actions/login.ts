"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import bcrypt from 'bcryptjs';

import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateTwoFactorToken, generateVerificationToken } from "@/lib/tokens";
import { sendTwoFactorEmail, sendVerificationEmail } from "@/lib/mail";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { db } from "@/lib/db";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";


export const login = async (
    values: z.infer<typeof LoginSchema>,
    callbackUrl?: string | null, 
) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, code } = validatedFields.data;

    const existingUser = await getUserByEmail(email);

    // If No account exists
    if (!existingUser || !existingUser.email) {
        return { error: "No account found with this email address" }
    };

    // If account is created using On of the Providors
    if (!existingUser.password) {
        return { error: "Account created with different provider!" }
    }
    // Check if password matches
    const passwordsMatch = await bcrypt.compare(
        password,
        existingUser.password
    );

    if (!passwordsMatch) {
        return { error: "Invalid credentials!" }
    }

    // Send Email verification token is not verified
    if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(
            existingUser.email,
        );

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token,
        );

        return { success: "Confirmation Email sent!" }
    }

    // Generate and send two factor If enabled
    if (existingUser.isTwoFactorEnabled && existingUser.email) {
        if (code) {
            // Verify code
            const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
            // CHECK IF TOKEN EXISTS
            if (!twoFactorToken) {
                return { error: "Invalid code!" }
            }
            // CHECK IS CODE MATCH
            if (twoFactorToken.token !== code) {
                return { error: "Invalid code!" }
            }

            //  CHECK IF CODE HAS EXPIRED
            const hasExpired = new Date(twoFactorToken.expires) < new Date();

            if (hasExpired) {
                return { error: "Code expired!" }
            }

            // DELETE THE TOKEN USED FOR THIS LOGIN THIS TIME
            await db.twoFactorToken.delete({
                where: {
                    id: twoFactorToken.id
                }
            });

            // CHECK IF A CONFIRMATION ALREADY EXISTS ? THEN DELETE IT
            const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

            if (existingConfirmation) {
                await db.twoFactorConfirmation.delete({
                    where: {
                        id: existingConfirmation.id
                    }
                });
            }

            //CREATE A NEW CONFIRMATION
            await db.twoFactorConfirmation.create({
                data: {
                    userId: existingUser.id,
                }
            });

        } else {
            // Before generate let's check if one exists
            const existingTwoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
            // CHECK IF TOKEN EXISTS
            if (existingTwoFactorToken) {
                //  CHECK IF CODE HAS EXPIRED
                const hasExpired = new Date(existingTwoFactorToken.expires) < new Date();

                if (!hasExpired) {
                    return { 
                        error: "Wait 10 minutes before requesting for new code!",
                        twoFactor: true,
                     }
                }
            }
            // IF CODE EXPIRED OR NO TOKEN EXISTS GENERATE NEW TOKEN
            const twoFactorToken = await generateTwoFactorToken(existingUser.email);

            await sendTwoFactorEmail(
                twoFactorToken.email,
                twoFactorToken.token,
            );
            return {
                success: "Two factor verification code sent to your email!",
                twoFactor: true 
            };
        }

    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        })

    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials" }
                default:
                    return { error: "Something went wrong!" }
            }
        }
        throw error;
    }
};


