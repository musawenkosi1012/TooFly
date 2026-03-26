"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.replace("/login?mode=signup")
    }, [router])

    return (
        <main className="min-h-screen bg-black flex items-center justify-center font-black text-white italic opacity-20 uppercase tracking-widest">
            Redirecting to Access Vault...
        </main>
    )
}
