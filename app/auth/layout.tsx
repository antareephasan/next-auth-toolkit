const AuthLayout = ({ children }: {
    children: React.ReactNode
}) => {
    return (
        <div className="h-full flex items-center justify-center
 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
 from-red-500 to-red-800">
            {children}
        </div>
    )
}

export default AuthLayout