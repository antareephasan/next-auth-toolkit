import { auth, signOut } from "@/auth"

const SettingsPage = async () => {

    const session = await auth();

    const handleSignOut = async () => {
        "use server"
        await signOut();
    }
    return (
        <div>
            {JSON.stringify(session)}
            <form action={handleSignOut}>
                <button className="bg-black text-white px-4 py-2 rounded-full" type="submit">
                    Sign Out
                </button>
            </form>
        </div>
    )
}

export default SettingsPage