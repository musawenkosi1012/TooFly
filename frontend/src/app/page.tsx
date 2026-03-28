"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Globe, UserPlus, LogIn } from "lucide-react"
import { useState, useEffect } from "react"

export default function Home() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedUser = sessionStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const dashboardHref = user?.role === "owner" || user?.role === "it_admin" ? "/admin" : "/catalogue"

  return (
    <main className="min-h-screen overflow-hidden bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 px-6">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-5%] left-[-5%] w-64 md:w-96 h-64 md:h-96 bg-accent/10 rounded-full blur-[80px] md:blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-accent font-bold uppercase tracking-[0.5em] text-[10px] mb-8 block">
              Volume 01 / SS26 Drop
            </span>
            <h1 className="text-5xl sm:text-7xl lg:text-[8rem] xl:text-[10rem] font-bold uppercase italic tracking-tighter leading-[0.8] mb-10 text-gradient">
              ATMOSPHERE <br /> PERMANENCE
            </h1>
            <p className="text-[11px] md:text-[13px] font-bold uppercase tracking-[0.1em] text-gray-400 max-w-sm mb-12 leading-relaxed opacity-70">
              Experience the evolution of streetwear. Fluid silhouettes meets digital permanence in our latest curated collection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {mounted && user ? (
                  <Link
                    href={dashboardHref}
                    className="px-10 py-5 bg-accent text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-2xl shadow-accent/20"
                  >
                    Go to Dashboard <ArrowRight size={14} />
                  </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/10"
                  >
                    Sign Up <UserPlus size={14} />
                  </Link>
                  <Link
                    href="/login"
                    className="px-10 py-5 border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    Sign In <LogIn size={14} />
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative hidden sm:block"
          >
            <div className="aspect-[4/5] rounded-[3rem] md:rounded-[4rem] overflow-hidden relative group shadow-3xl shadow-black/20">
              <img
                src="/images/landing.jpeg"
                alt="Featured Drop"
                className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-40 px-6 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center lg:text-left">
            {[
              { icon: Zap, title: "Real-time Drops", desc: "Instant access to limited collections directly from our digital atelier." },
              { icon: Shield, title: "Protected Data", desc: "Every piece is verified and tracked on our private curator network." },
              { icon: Globe, title: "Global Collective", desc: "Shipping across 20+ countries with sustainable carbon-neutral logistics." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-black dark:text-white mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500 mx-auto lg:mx-0">
                  <feature.icon size={24} />
                </div>
                <h4 className="text-xl font-bold uppercase italic tracking-tighter mb-4">{feature.title}</h4>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 leading-relaxed opacity-60">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Lab CTA */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] -z-10" />
        <div className="max-w-5xl mx-auto text-center space-y-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
            >
                <span className="text-accent font-bold uppercase tracking-[0.4em] text-[10px]">Creative Suite</span>
                <h2 className="text-5xl md:text-8xl font-bold uppercase italic tracking-tighter leading-none text-gradient">
                    Architecture <br /> of Thought
                </h2>
                <p className="text-[11px] md:text-[13px] font-bold uppercase tracking-[0.2em] text-gray-500 max-w-xl mx-auto leading-relaxed">
                    Access our proprietary design engine. Create custom silhouettes and render them at <span className="text-accent">300 DPI</span> for immediate production synchronization.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
            >
                <Link 
                    href="/design-lab" 
                    className="inline-flex items-center justify-center px-12 py-6 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.4em] text-[11px] rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-3xl shadow-accent/10 group"
                >
                    Initialize Lab <ArrowRight size={16} className="ml-4 group-hover:translate-x-2 transition-transform" />
                </Link>
            </motion.div>
        </div>
      </section>
    </main>
  )
}
