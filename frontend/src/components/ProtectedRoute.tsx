"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ 
    children, 
    allowedRoles 
}: { 
    children: React.ReactNode, 
    allowedRoles?: string[]
}) {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = () => {
            const token = sessionStorage.getItem("token")
            const userStr = sessionStorage.getItem("user")
            
            if (!token || !userStr) {
                router.push("/login")
                return
            }

            try {
                const user = JSON.parse(userStr)
                
                // If specific roles are required, check them
                if (allowedRoles && !allowedRoles.includes(user.role)) {
                    router.push("/") // Redirect to home if not authorized for this role
                    return
                }
            } catch (e) {
                router.push("/login")
                return
            }

            setIsAuthorized(true)
        }

        checkAuth()
    }, [router, allowedRoles])

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        )
    }

    return <>{children}</>
}
