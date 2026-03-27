"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Shield, Terminal, Loader2, RefreshCcw } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { getAuthToken, API_ROOT } from "@/lib/api"

interface TrafficLog {
    id: number
    timestamp: string
    path: string
    method: string
    ip_address: string
}

export default function MonitorDashboard() {
    const [logs, setLogs] = useState<TrafficLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const token = getAuthToken()
            const response = await fetch(`${API_ROOT}/monitor/traffic`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setLogs(data)
            }
        } catch (err) {
            console.error("Traffic sync failed:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <ProtectedRoute allowedRoles={["it_admin"]}>
            <main className="min-h-screen pt-32 pb-20 px-6 font-mono">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                        <div>
                            <span className="text-indigo-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-2 block animate-pulse">
                                System Monitor v1.2.0_STABLE
                            </span>
                            <h1 className="text-6xl md:text-8xl font-bold uppercase italic tracking-tighter text-gradient leading-[0.8]">
                                Traffic <br /> Console
                            </h1>
                        </div>
                        <button 
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-6 py-4 glass rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                            Sync Stream
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="p-8 glass rounded-[2.5rem] relative overflow-hidden group">
                           <Activity className="text-indigo-500 mb-6" size={24} />
                           <h3 className="text-4xl font-bold italic tracking-tighter mb-1">{logs.length}</h3>
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Total Frames Logged</p>
                        </div>
                        <div className="p-8 glass rounded-[2.5rem] relative overflow-hidden group border-indigo-500/20 border">
                           <Shield className="text-emerald-500 mb-6" size={24} />
                           <h3 className="text-4xl font-bold italic tracking-tighter mb-1">Active</h3>
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Security Layer Status</p>
                        </div>
                        <div className="p-8 glass rounded-[2.5rem] relative overflow-hidden group">
                           <Terminal className="text-yellow-500 mb-6" size={24} />
                           <h3 className="text-4xl font-bold italic tracking-tighter mb-1">TCP/IP</h3>
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Entry Protocol</p>
                        </div>
                    </div>

                    <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5">
                        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-[0.3em]">Live Traffic Stream</h2>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-500 uppercase font-bold tracking-widest">
                                        <th className="p-6">Timestamp</th>
                                        <th className="p-6">Method</th>
                                        <th className="p-6">Path</th>
                                        <th className="p-6">Source IP</th>
                                        <th className="p-6 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading && logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center">
                                                <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                                            </td>
                                        </tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-6 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td className="p-6 font-bold text-indigo-400">{log.method}</td>
                                            <td className="p-6 font-bold tracking-tighter">{log.path}</td>
                                            <td className="p-6 text-gray-500">{log.ip_address}</td>
                                            <td className="p-6 text-right">
                                                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md font-bold">200 OK</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    )
}
