"use client"

import dynamic from "next/dynamic"

// Dynamic import for react-konva to prevent SSR issues
const DesignLabStage = dynamic(() => import("./DesignLabStage"), { 
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-white italic opacity-40 uppercase tracking-[0.5em]">Initializing Engine...</p>
            </div>
        </div>
    )
})

export default function DesignLab() {
    return <DesignLabStage />
}
