"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Heart, Plus, Expand, ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { API_ROOT } from "@/lib/api"

export interface Product {
    id: number | string
    name: string
    price: string | number
    category: string
    image_url: string
    likes_count: number
    images?: { id: number, url: string }[]
    comments?: { id: number, text: string, username: string }[]
}

interface ProductCardProps {
    product: Product
    delay?: number
}

export default function ProductCard({ product, delay = 0 }: ProductCardProps) {
    const [isLiked, setIsLiked] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)
    
    const [localLikesCount, setLocalLikesCount] = useState(product.likes_count)
    const [localComments, setLocalComments] = useState(product.comments || [])
    const [isCommenting, setIsCommenting] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [commentText, setCommentText] = useState("")

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!commentText.trim()) return
        
        const token = sessionStorage.getItem("token")
        if (!token) {
            window.location.href = `/register?redirect=${window.location.pathname}`
            return
        }

        try {
            const commentUrl = `${API_ROOT}/products/${product.id}/comments`
            const res = await fetch(commentUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: commentText })
            })
            if (res.ok) {
                const newComment = await res.json()
                setLocalComments(prev => [...prev, newComment])
                setCommentText("")
            } else if (res.status === 401) {
                sessionStorage.removeItem("token")
                window.location.href = `/register?redirect=${window.location.pathname}`
            } else {
                alert("Failed to post comment. Make sure you are logged in.")
            }
        } catch (err) {
            console.error(err)
            alert("Error posting comment")
        }
    }

    const toggleLike = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const token = sessionStorage.getItem("token")
        if (!token) {
            window.location.href = `/register?redirect=${window.location.pathname}`
            return
        }

        // Optimistic update
        const originalLiked = isLiked
        const originalCount = localLikesCount
        setIsLiked(!originalLiked)
        setLocalLikesCount(prev => originalLiked ? Math.max(0, prev - 1) : prev + 1)

        try {
            const likeUrl = `${API_ROOT}/products/${product.id}/like`
            
            const res = await fetch(likeUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setIsLiked(data.is_liked)
                setLocalLikesCount(data.likes_count)
            } else if (res.status === 401) {
                sessionStorage.removeItem("token")
                window.location.href = `/register?redirect=${window.location.pathname}`
            } else {
                setIsLiked(originalLiked)
                setLocalLikesCount(originalCount)
            }
        } catch (err) {
            console.error(err)
            setIsLiked(originalLiked)
            setLocalLikesCount(originalCount)
        }
    }

    const formatImageUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${API_ROOT}${url.startsWith("/") ? "" : "/"}${url.startsWith("static/") ? "" : "static/"}${url}`;
    };

    const allImages = [
        formatImageUrl(product.image_url),
        ...(product.images || []).map(img => formatImageUrl(img.url))
    ].filter(url => url !== "");

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % allImages.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4 }
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.4 }
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            className="group block"
        >
            <div className="relative aspect-[4/5] glass rounded-[2.5rem] overflow-hidden mb-6 group/img cursor-pointer">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                        key={currentIndex}
                        src={allImages[currentIndex]}
                        alt={product.name}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-105"
                    />
                </AnimatePresence>

                {/* Gradient overlay for better UI contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Left/Right Navigation */}
                {allImages.length > 1 && (
                    <>
                        <button 
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center opacity-0 -translate-x-4 group-hover/img:opacity-100 group-hover/img:translate-x-0 transition-all duration-300 hover:bg-white hover:text-black shadow-xl z-20"
                        >
                            <ChevronLeft size={20} className="ml-[-2px]" />
                        </button>
                        <button 
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center opacity-0 translate-x-4 group-hover/img:opacity-100 group-hover/img:translate-x-0 transition-all duration-300 hover:bg-white hover:text-black shadow-xl z-20"
                        >
                            <ChevronRight size={20} className="mr-[-2px]" />
                        </button>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20 opacity-0 group-hover/img:opacity-100 translate-y-4 group-hover/img:translate-y-0 transition-all duration-300">
                            {allImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setDirection(idx > currentIndex ? 1 : -1)
                                        setCurrentIndex(idx)
                                    }}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-md",
                                        currentIndex === idx ? "w-4 bg-white" : "bg-white/50 hover:bg-white/80"
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Add to Cart icon */}
                <button 
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const token = sessionStorage.getItem("token")
                        if (!token) {
                            window.location.href = `/register?redirect=${window.location.pathname}`
                        } else {
                            const currentCart = JSON.parse(sessionStorage.getItem("cart") || "[]")
                            const existingItem = currentCart.find((i: any) => i.id === product.id)
                            if (existingItem) {
                                existingItem.quantity += 1
                            } else {
                                currentCart.push({
                                    id: product.id,
                                    name: product.name,
                                    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
                                    category: product.category,
                                    image_url: product.image_url,
                                    quantity: 1
                                })
                            }
                            sessionStorage.setItem("cart", JSON.stringify(currentCart))
                            window.dispatchEvent(new Event('cartUpdated'))
                        }
                    }}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center translate-y-8 opacity-0 group-hover/img:translate-y-0 group-hover/img:opacity-100 transition-all duration-500 delay-100 hover:scale-110 z-20 shadow-lg shadow-accent/20"
                >
                    <Plus size={24} />
                </button>

                {/* Top Actions Overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover/img:opacity-100 translate-x-4 group-hover/img:translate-x-0 transition-all duration-500 z-20">
                    <button 
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsFullscreen(true)
                        }}
                        className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-110"
                    >
                        <Expand size={16} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsCommenting(true)
                        }}
                        className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-110"
                    >
                        <MessageCircle size={16} />
                    </button>
                    <button
                        onClick={toggleLike}
                        className={cn(
                            "w-10 h-10 glass rounded-full flex items-center justify-center transition-all hover:scale-110",
                            isLiked ? "text-red-500 fill-red-500" : "hover:bg-white hover:text-black"
                        )}
                    >
                        <Heart size={16} />
                    </button>
                </div>

                {/* Fullscreen Modal Overlay */}
                <AnimatePresence>
                    {isFullscreen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center cursor-zoom-out"
                        >
                            <button className="absolute top-8 right-8 w-12 h-12 glass rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-[110]">
                                <X size={24} />
                            </button>
                            
                            {allImages.length > 1 && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); prevImage(e); }}
                                        className="absolute left-8 w-16 h-16 glass rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-[110]"
                                    >
                                        <ChevronLeft size={32} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); nextImage(e); }}
                                        className="absolute right-8 w-16 h-16 glass rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-[110]"
                                    >
                                        <ChevronRight size={32} />
                                    </button>
                                </>
                            )}
                            
                            <motion.img
                                key={currentIndex}
                                src={allImages[currentIndex]}
                                alt={product.name}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.1, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                                onClick={(e) => e.stopPropagation()} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Commenting Overlay */}
                <AnimatePresence>
                    {isCommenting && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation() }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex flex-col p-6 overflow-hidden"
                        >
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsCommenting(false) }}
                                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-white font-bold uppercase italic tracking-widest text-xs mb-4 text-center mt-2">Comments ({localComments.length})</h3>
                            
                            <div className="flex-1 w-full overflow-y-auto pr-2 mb-4 space-y-3 custom-scrollbar">
                                {localComments.length === 0 ? (
                                    <p className="text-white/50 text-xs text-center mt-8 font-mono">No comments yet. Be the first!</p>
                                ) : (
                                    localComments.map((comment, i) => (
                                        <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                                            <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1">@{comment.username}</p>
                                            <p className="text-white text-xs leading-relaxed">{comment.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <form 
                                onSubmit={submitComment} 
                                className="w-full flex gap-2 mt-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Say something hype..."
                                    className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent font-mono"
                                />
                                <button type="submit" onClick={submitComment} className="bg-accent text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform flex items-center justify-center cursor-pointer text-[10px] font-bold uppercase tracking-widest z-50">
                                    POST
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex justify-between items-start px-4">
                <div>
                    <h4 className="font-bold uppercase italic tracking-tighter text-xl leading-none mb-1">{product.name}</h4>
                    <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em]">{product.category}</p>
                </div>
                <div className="text-right">
                    <span className="font-bold text-lg">${product.price}</span>
                    <div className="text-[10px] text-gray-400 flex items-center gap-3 justify-end font-bold uppercase tracking-widest mt-1">
                        <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" onClick={() => setIsCommenting(true)}>
                            <MessageCircle size={10} /> {localComments.length}
                        </span>
                        <span className="flex items-center gap-1 cursor-pointer" onClick={toggleLike}>
                            <Heart size={10} className={cn(isLiked && "text-red-500 fill-red-500")} /> {localLikesCount}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
