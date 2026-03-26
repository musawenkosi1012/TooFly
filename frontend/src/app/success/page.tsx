"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SuccessPage() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Clear cart on successful payment return
        sessionStorage.removeItem("cart")
        sessionStorage.removeItem("paynow_poll_url")
        document.body.style.paddingRight = "0px"
        window.dispatchEvent(new Event('cartUpdated'))
        setShow(true)
    }, [])

    return (
        <main className="min-h-screen bg-black flex items-center justify-center px-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={show ? { opacity: 1, scale: 1 } : {}}
                transition={{ type: "spring", damping: 20, stiffness: 150 }}
                className="glass p-12 rounded-[2.5rem] max-w-lg w-full text-center space-y-8"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={show ? { scale: 1 } : {}}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
                >
                    <CheckCircle className="text-emerald-500" size={48} />
                </motion.div>

                <h1 className="text-4xl font-bold uppercase italic tracking-tighter">
                    Payment <span className="text-accent">Confirmed</span>
                </h1>
                
                <p className="text-gray-400 text-sm leading-relaxed">
                    Your order has been processed successfully via Paynow. 
                    You will receive a confirmation shortly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link 
                        href="/catalogue"
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
                    >
                        <ShoppingBag size={14} /> Continue Shopping
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-8 py-4 border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft size={14} /> Home
                    </Link>
                </div>
            </motion.div>
        </main>
    )
}
