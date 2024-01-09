"use client";

import { logout } from "@/actions/logout";
import { useCurrentUser } from "@/hooks/use-current-user";

const SettingsPage = () => {
    const currentUser = useCurrentUser();
    const onClick = async () => {
        await logout();
    }
    return (
        <div className="bg-white p-10 rounded-xl">
            <button
                onClick={onClick}
                className="bg-black text-white px-4 py-2 rounded-full"
                type="submit"
            >
                Sign Out
            </button>
        </div>
    )
}

export default SettingsPage