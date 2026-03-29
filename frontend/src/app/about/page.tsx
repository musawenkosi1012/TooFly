"use client"

import { motion } from "framer-motion"

export default function AboutPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <span className="text-accent font-bold uppercase tracking-[0.4em] text-[10px] mb-4 block">
                        The Manifesto
                    </span>
                    <h1 className="text-7xl md:text-9xl font-bold uppercase italic tracking-tighter text-gradient leading-[0.8]">
                        About <br /> Too Fly
                    </h1>
                </motion.div>

                <div className="space-y-20">
                    <section className="glass p-12 md:p-20 rounded-[3rem]">
                        <h2 className="text-3xl font-bold uppercase italic tracking-tighter mb-8 italic">Culture & Purpose</h2>
                        <div className="space-y-6 text-lg text-gray-500 leading-relaxed">
                            <p>
                                Too Fly is a culture-driven brand built for individuals who move with purpose. 
                                It represents confidence, elevation, and self-definition. 
                                Every piece reflects identity, not conformity. 
                            </p>
                            <p className="text-white font-bold italic">
                                This is for people who create their own lane and stay in it.
                            </p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="p-12 glass rounded-[2.5rem]">
                            <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-4">The Atelier</h3>
                            <p className="text-gray-500 text-sm">Based in the intersection of digital space and urban density, our atelier focus on zero-waste technical shells and generative knitwear.</p>
                        </div>
                        <div className="p-12 glass rounded-[2.5rem]">
                            <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-4">The Stream</h3>
                            <p className="text-gray-500 text-sm">Our inventory is a live stream. Items appear and disappear in real-time, dictated by the collective demand of our global curators.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
