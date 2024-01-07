"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";

export const newVerification = async (
    token: string,
) => {
        const existingToken = await getVerificationTokenByToken(token);

        if (!existingToken) {
            return { error: "Invalid Token!" }
        }

        const hasExpired = new Date(existingToken.expires) < new Date();
        if (hasExpired) {
            return { error: "Token has Expired! Login to get a new token." }
        }

        const existingUser = await getUserByEmail(existingToken.email);

        if (!existingUser) {
            return { error: "User doesn't exist! Create a new account!" }
        }

        await db.user.update({
            where: {
                id: existingUser.id
            },
            data: {
                emailVerified: new Date(),
                email: existingToken.email
            }
        })

        await db.verificationToken.delete({
            where: {
                id: existingToken.id
            }
        })

        return { success: "Email verified!" };
}