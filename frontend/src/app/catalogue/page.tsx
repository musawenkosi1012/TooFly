"use client"

import { useState, useEffect } from "react"
import ProductCard, { Product } from "@/components/ProductCard"
import { motion } from "framer-motion"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchProducts, seedProducts } from "@/lib/api"

export default function CataloguePage() {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState("All")
    const [search, setSearch] = useState("")

    const categories = ["All", "Outerwear", "Streetwear", "Pants", "Tees", "Accessories"]

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await fetchProducts()
                setProducts(data)
            } catch (err) {
                setError("Unable to sync with the global stream. Ensure the backend is running.")
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
        loadProducts()
    }, [])

    const filteredProducts = products.filter(p =>
        (filter === "All" || p.category === filter) &&
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        )
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <div className="w-full md:w-auto">
                        <h1 className="text-6xl md:text-8xl font-bold uppercase italic tracking-tighter text-gradient leading-[0.8]">
                            Live <br /> Stream
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400 mt-6">
                            Global Inventory / SS26 Collection
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 items-end w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search pieces..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full glass bg-white/5 p-4 pl-12 rounded-2xl text-sm focus:bg-white dark:focus:bg-black transition-all outline-none border-none"
                            />
                        </div>
                        <div className="flex gap-2 p-1 glass rounded-2xl overflow-x-auto max-w-full">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilter(cat)}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                                        filter === cat ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" : "hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-8 glass bg-red-500/5 rounded-[2rem] text-center mb-16">
                        <p className="text-red-500 font-bold uppercase tracking-widest text-xs">{error}</p>
                    </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {filteredProducts.map((product, i) => (
                        <ProductCard key={product.id} product={product} delay={i * 0.05} />
                    ))}
                </div>

                {filteredProducts.length === 0 && !error && (
                    <div className="py-40 text-center">
                        {products.length === 0 ? (
                            <p className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-gray-300">Coming Soon</p>
                        ) : (
                            <>
                                <p className="text-2xl font-bold uppercase italic tracking-tighter text-gray-300">No items found matching your filters</p>
                                <button
                                    onClick={() => { setFilter("All"); setSearch("") }}
                                    className="mt-4 text-xs font-bold uppercase tracking-widest text-accent hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
