"use server";

import { signOut } from "@/auth";

export const logout = async () => {
    //SOME SERVER STUFFS BEFORE SIGNOUT THE USER
    await signOut();
}