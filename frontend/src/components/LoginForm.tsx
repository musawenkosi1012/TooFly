"use client"

import { useState } from "react"
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import { login, API_ROOT } from "@/lib/api"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginForm({ onToggle }: { onToggle?: () => void }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get("redirect") || "/catalogue"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        try {
            const data = await login(email, password)
            if (data.user.role === "owner") router.push("/admin")
            else if (data.user.role === "it_admin") router.push("/monitor")
            else router.push(redirectUrl)
            router.refresh()
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
                    Secure Access
                </span>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">Sign In</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Sign in to your account</p>
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
                            placeholder="name@toofly.com"
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-accent transition-all font-bold text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
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
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Sign In Now"}
                    {!isLoading && <ArrowRight size={16} />}
                </button>

                {onToggle && (
                    <button 
                        type="button"
                        onClick={onToggle}
                        className="w-full text-center py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-accent transition-colors md:hidden"
                    >
                        New to the vault? <span className="text-accent underline underline-offset-4">Create Account</span>
                    </button>
                )}
            </form>
        </div>
    )
}
