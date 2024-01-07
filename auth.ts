import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { db } from "@/lib/db"
import authConfig from "@/auth.config"
import { getUserById } from "@/data/user"
import { UserRole } from "@prisma/client"
import { generateVerificationToken } from "./lib/tokens"
import { sendVerificationEmail } from "./lib/mail"

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },
    events: {
        async linkAccount({ user }) {
            await db.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() }
            })
        }
    },
    callbacks: {
        async signIn({ user, account }) {
            // Allow OAuth without email verification
            if (account?.provider !== "credentials") return true;

            const existingUser = await getUserById(user.id);
            // Prevent signin without verification
            // if (!existingUser?.emailVerified) return false;

            // My own way
            if (!existingUser?.emailVerified) {
                if (existingUser?.email) {
                    const verifationToken = await generateVerificationToken(existingUser.email);
                    await sendVerificationEmail(
                        verifationToken.email,
                        verifationToken.token
                    );
                    throw new Error("emailNotVerified")
                }
                return false
            }

            // TODO: Add 2FA check
            return true;
        },
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role as UserRole
            }
            return session;
        },
        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);
            if (!existingUser) return token;
            token.role = existingUser.role

            return token;
        }
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig
})