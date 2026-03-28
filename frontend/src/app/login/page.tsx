"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"
import LoginForm from "@/components/LoginForm"
import RegisterForm from "@/components/RegisterForm"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

function AuthContent() {
    const searchParams = useSearchParams()
    const [isLogin, setIsLogin] = useState(true)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mode = searchParams.get("mode")
        if (mode === "signup") setIsLogin(false)

        const handleResize = () => setIsMobile(window.innerWidth < 768)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [searchParams])

    return (
        <main className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">
            {/* Background Aesthetic */}
            <div className="absolute top-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent/20 rounded-full blur-[80px] md:blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-white/5 rounded-full blur-[80px] md:blur-[120px] -z-10" />

            <div className={cn(
                "relative w-full h-screen md:h-screen flex flex-col md:flex-row shadow-2xl overflow-y-auto md:overflow-hidden bg-black max-w-[1600px] mx-auto",
                isMobile ? "scrollbar-hide" : ""
            )}>
                
                {/* --- Form Section --- */}
                <motion.div 
                    animate={{ 
                        x: isMobile ? "0%" : (isLogin ? "0%" : "100%"),
                        y: "0%"
                    }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 22,
                        mass: 1.2
                    }}
                    className={cn(
                        "relative w-full md:w-1/2 flex items-center justify-center bg-[#0a0a0a] z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]",
                        isMobile ? "py-20 h-auto" : "h-full"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isLogin ? (
                            <motion.div
                                key="login-form-mob"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-full flex justify-center z-10 px-4 sm:px-12"
                            >
                                <LoginForm onToggle={() => setIsLogin(false)} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="signup-form-mob"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-full flex justify-center z-10 px-4 sm:px-12"
                            >
                                <RegisterForm onToggle={() => setIsLogin(true)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* --- Full-Screen Sliding Overlay Panel --- */}
                <motion.div
                    initial={false}
                    animate={{ 
                        x: isMobile ? "0%" : (isLogin ? "100%" : "0%"),
                        y: "0%",
                        opacity: isMobile ? 1 : 1
                    }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 22,
                        mass: 1.2
                    }}
                    className={cn(
                        "w-full md:h-screen md:w-1/2 z-20 overflow-hidden",
                        isMobile ? "relative order-first h-[100dvh] py-12" : "absolute top-0 left-0 h-full"
                    )}
                >
                    <div className={cn(
                        "absolute inset-0 bg-white shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden",
                        isMobile ? "min-h-[100dvh]" : ""
                    )}>
                        {/* Background Slide Visual */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "right" : "left"}
                                initial={{ opacity: 0, x: isLogin ? 100 : -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLogin ? -100 : 100 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0"
                            >
                                {!isLogin ? (
                                    <div className="absolute inset-0">
                                        <img 
                                            src="/images/slide left.jpeg"
                                            alt="Mood"
                                            className="w-full h-full object-cover grayscale brightness-50"
                                        />
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-[#f5f5f5]" />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Interactive Content inside Overlay */}
                        <motion.div
                            key={isLogin ? "to-signup" : "to-signin"}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className={cn(
                                "space-y-8 md:space-y-12 relative z-10 p-8 md:p-12 text-center",
                                !isLogin ? "text-white" : "text-black"
                            )}
                        >
                            <div className="space-y-4 md:space-y-6 px-4">
                                <h2 className={cn(
                                    "text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-4 underline decoration-4 md:decoration-8 underline-offset-4 md:underline-offset-8 whitespace-pre-line text-center",
                                    !isLogin ? "decoration-accent" : "decoration-black"
                                )}>
                                    {isLogin ? "Join the\nCollective" : "Return to\nStation"}
                                </h2>
                                <p className="text-[9px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] opacity-80 max-w-[220px] md:max-w-[300px] mx-auto leading-loose">
                                    {isLogin 
                                        ? "Request entry into the restricted access toofly vault. Curated silhouettes await." 
                                        : "Resume your session and continue the exploration of fluid forms."}
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => setIsLogin(!isLogin)}
                                className={cn(
                                    "group relative flex items-center justify-center gap-4 md:gap-6 py-4 md:py-6 px-10 md:px-12 rounded-none transition-all hover:scale-105 active:scale-95 border-2 w-full",
                                    !isLogin ? "bg-white text-black border-white" : "bg-black text-white border-black"
                                )}
                            >
                                <span className="text-[11px] md:text-[14px] font-black uppercase tracking-[0.3em] relative z-10">
                                    {isLogin ? "Create an Account" : "Login"}
                                </span>
                                <div className="relative z-10">
                                    {isLogin ? (
                                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                                    ) : (
                                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                                    )}
                                </div>
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
            
            {/* Branding Watermark */}
            <div className="fixed bottom-12 left-12 text-2xl font-black italic tracking-tighter uppercase opacity-20">
                Toofly<span className="text-accent">©</span>
            </div>
        </main>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center font-black text-white italic opacity-20">LOADING...</div>}>
            <AuthContent />
        </Suspense>
    )
}
