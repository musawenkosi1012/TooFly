"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, TrendingUp, Activity, Plus, Trash2, Loader2, Search, X, ImagePlus } from "lucide-react"
import { fetchProducts, createProduct, Product, API_ROOT, API_V1 } from "@/lib/api"
import ProductCard from "@/components/ProductCard"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [statsData, setStatsData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeploying, setIsDeploying] = useState(false) // Used for global refresh if needed, but mainly for UI
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingToProduct, setIsUploadingToProduct] = useState<number | null>(null)
    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        price: 0,
        category: "Outerwear",
        image_url: "",
        stock: 10
    })
    
    async function loadDashboard() {
        try {
            const token = sessionStorage.getItem("token")
            
            const [productData, dashRes] = await Promise.all([
                fetchProducts(),
                fetch(`${API_ROOT}/owner/dashboard`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ])
            
            if (dashRes.ok) {
                const dashData = await dashRes.json()
                setStatsData(dashData)
            }

            setProducts(productData)
        } catch (err) {
            console.error("Dashboard sync error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadDashboard()
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to remove this piece from the stream?")) return
        try {
            await fetch(`${API_ROOT}/products/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${sessionStorage.getItem("token")}` }
            })
            // Refresh local state
            setProducts(products.filter(p => p.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeployClick = () => {
        setIsModalOpen(true)
    }

    const resizeImage = (file: File, maxWidth: number = 1024): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        try {
            const optimizedBase64 = await resizeImage(file);
            setNewProduct({...newProduct, image_url: optimizedBase64});
        } catch (err) {
            console.error("Image optimization failed", err);
            alert("Failed to process image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: number) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        
        setIsUploadingToProduct(productId)
        
        try {
            const optimizedUrls = await Promise.all(
                files.map(file => resizeImage(file, 800)) // Use slightly smaller for thumbnails
            );
            
            // Append images to product with AUTH headers
            if (optimizedUrls.length > 0) {
                const token = sessionStorage.getItem("token")
                const attachUrl = `${API_ROOT}/products/${productId}/images`
                const attachRes = await fetch(attachUrl, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ urls: optimizedUrls })
                })
                
                if (attachRes.ok) {
                   await loadDashboard()
                } else {
                   const err = await attachRes.json()
                   console.error("Link failed:", err)
                   alert(`Failed to link pictures: ${err.detail || 'Access Denied'}`)
                }
            }
        } catch (error) {
            console.error(error)
            alert("Failed to process additional images")
        } finally {
            setIsUploadingToProduct(null)
            e.target.value = "" // Reset input
        }
    }

    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await createProduct({
                ...newProduct,
                price: Number(newProduct.price),
                stock: Number(newProduct.stock)
            })
            await loadDashboard()
            setIsModalOpen(false)
            setNewProduct({ name: "", description: "", price: 0, category: "Outerwear", image_url: "", stock: 10 })
        } catch (err) {
            console.error("Failed to add product:", err)
            alert("Failed to create product. Check backend logs.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const stats = [
        { label: "Active Drops", value: statsData?.active_products || products.length, icon: Package, color: "text-blue-500" },
        { label: "Stream Traffic", value: statsData?.total_traffic >= 1000 ? `${(statsData.total_traffic/1000).toFixed(1)}k` : statsData?.total_traffic || "0", icon: Activity, color: "text-emerald-500" },
        { label: "Conversion", value: `${statsData?.conversion_rate || 0}%`, icon: TrendingUp, color: "text-purple-500" },
    ]

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        )
    }

    return (
        <ProtectedRoute allowedRoles={["owner", "it_admin"]}>
            <main className="min-h-screen pt-32 pb-20 px-6 bg-white dark:bg-black relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                        <div>
                            <h1 className="text-6xl md:text-8xl font-bold uppercase italic tracking-tighter text-gradient leading-[0.8]">
                                Admin <br /> Portal
                            </h1>
                            <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400 mt-6">
                                Infrastructure Control / SS26 Operations
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:w-auto">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass p-8 rounded-[2rem] min-w-[200px]"
                                >
                                    <stat.icon className={`${stat.color} mb-6`} size={24} />
                                    <p className="text-4xl font-black italic tracking-tighter mb-1">{stat.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                        <div className="animate-reveal">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <h2 className="text-3xl font-bold uppercase italic tracking-tighter">Inventory Lab</h2>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={async () => {
                                            if (!confirm("CRITICAL: This will remove ALL pieces from the global stream. Proceed?")) return
                                            try {
                                                const res = await fetch(`${API_ROOT}/products/manage/wipe`, { method: 'DELETE' })
                                                if (res.ok) setProducts([])
                                            } catch (err) { console.error(err) }
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                    >
                                        <Trash2 size={14} />
                                        Wipe Stream
                                    </button>
                                    <button 
                                        onClick={handleDeployClick}
                                        className="flex items-center gap-2 px-6 py-3 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-lg shadow-accent/20"
                                    >
                                        <Plus size={14} />
                                        Add Good to Catalogue
                                    </button>
                                </div>

                            </div>

                            <div className="glass rounded-[2.5rem] overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-white/5">
                                            <th className="p-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">Piece</th>
                                            <th className="p-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</th>
                                            <th className="p-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">Stock</th>
                                            <th className="p-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">Price</th>
                                            <th className="p-8 text-[10px] font-bold uppercase tracking-widest text-gray-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
                                                            {/* We render fallback if image_url is broken */}
                                                            <img 
                                                                src={product.image_url} 
                                                                alt="" 
                                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all bg-gray-200 dark:bg-zinc-800" 
                                                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }}
                                                            />
                                                        </div>
                                                        <span className="font-bold uppercase italic tracking-tight">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="p-8 font-mono text-sm">{product.stock || 0}</td>
                                                <td className="p-8 font-mono text-sm">${Number(product.price).toFixed(2)}</td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative">
                                                            <button 
                                                                disabled={isUploadingToProduct === Number(product.id)}
                                                                className="p-3 text-accent/50 hover:text-accent hover:bg-accent/10 rounded-xl transition-all relative overflow-hidden flex items-center justify-center group/btn"
                                                                title="Add more preview pictures"
                                                            >
                                                                {isUploadingToProduct === Number(product.id) ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                                                                <input 
                                                                    type="file" 
                                                                    multiple 
                                                                    accept="image/*" 
                                                                    onChange={(e) => handleMultipleImageUpload(e, Number(product.id))}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                />
                                                            </button>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDelete(Number(product.id))}
                                                            className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL Overlay */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl relative"
                            >
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-6 right-6 p-2 text-gray-500 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-full transition-all"
                                >
                                    <X size={18} />
                                </button>
                                
                                <h3 className="text-3xl font-bold uppercase italic tracking-tighter mb-8">Deploy Drop</h3>
                                
                                <form onSubmit={handleSubmitProduct} className="flex flex-col gap-5">
                                    <div className="flex gap-4">
                                        <input 
                                            required 
                                            type="text" 
                                            placeholder="Piece Name" 
                                            value={newProduct.name}
                                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent rounded-xl text-sm outline-none transition-all font-bold tracking-tight"
                                        />
                                        <select 
                                            value={newProduct.category}
                                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                                            className="w-1/3 px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent rounded-xl text-xs font-bold uppercase tracking-widest outline-none transition-all"
                                        >
                                            <option value="Outerwear">Outerwear</option>
                                            <option value="Streetwear">Streetwear</option>
                                            <option value="Pants">Pants</option>
                                            <option value="Tees">Tees</option>
                                            <option value="Accessories">Accessories</option>
                                        </select>
                                    </div>
                                    
                                    <textarea 
                                        placeholder="Description"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent rounded-xl text-sm outline-none transition-all resize-none min-h-[80px]"
                                    />
                                    
                                    <div className="flex gap-4">
                                        <div className="relative w-1/2">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                                            <input 
                                                required 
                                                type="number" 
                                                step="0.01"
                                                placeholder="Price" 
                                                value={newProduct.price || ""}
                                                onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                                                className="w-full pl-8 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent rounded-xl text-sm outline-none transition-all font-mono"
                                            />
                                        </div>
                                        <input 
                                            required 
                                            type="number" 
                                            placeholder="Initial Stock" 
                                            value={newProduct.stock || ""}
                                            onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                                            className="w-1/2 px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent rounded-xl text-sm outline-none transition-all font-mono"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Image Upload</label>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">Keep files under 4MB</span>
                                        </div>
                                        {newProduct.image_url ? (
                                            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-dashed border-accent">
                                                <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setNewProduct({...newProduct, image_url: ""})}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full relative">
                                                <input 
                                                    required 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploading}
                                                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent rounded-xl text-sm outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90 file:cursor-pointer disabled:opacity-50"
                                                />
                                                {isUploading && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="animate-spin text-accent" size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    
                                    <button 
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="mt-4 w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Initialize Deployment"}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </ProtectedRoute>
    )
}
