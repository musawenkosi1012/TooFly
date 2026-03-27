"use client"

import { useState } from "react"
import { Loader2, Mail, Lock, UserPlus } from "lucide-react"
import { register } from "@/lib/api"
import { useRouter, useSearchParams } from "next/navigation"

export default function RegisterForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get("redirect") || "/catalogue"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        setIsLoading(true)
        setError("")
        try {
            await register(email, password)
            // Redirect or switch mode locally
            // Redirect to login with the intent to go back to the original destination
            router.push(`/login?mode=signin&redirect=${encodeURIComponent(redirectUrl)}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-sm px-6">
            <div className="mb-10">
                <span className="text-accent font-bold uppercase tracking-[0.4em] text-[10px] mb-2 block">
                    Sign Up Now
                </span>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">Create Account</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Apply for access to the system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-accent transition-all font-bold text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Access Code</label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create Password"
                                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-accent transition-all font-bold text-sm"
                                required
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-accent transition-all font-bold text-sm"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
                )}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Sign Up Now"}
                    {!isLoading && <UserPlus size={16} />}
                </button>
            </form>
        </div>
    )
}
