"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, User, Menu, X, Crown, Search, Trash, Sun, Moon, Palette } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/api"

import { useRouter } from "next/navigation"

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [cartItems, setCartItems] = useState<any[]>([])
    const [user, setUser] = useState<{ email: string; role: string } | null>(null)
    const pathname = usePathname()
    const router = useRouter()
    const [theme, setTheme] = useState<'light' | 'dark' | 'grey'>('dark')

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        
        const storedUser = sessionStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else {
            setUser(null)
        }

        const loadCart = () => {
            const stored = sessionStorage.getItem("cart")
            if (stored) {
                setCartItems(JSON.parse(stored))
            }
        }
        
        const handleCartUpdate = () => {
            loadCart()
        }

        loadCart()
        window.addEventListener('cartUpdated', handleCartUpdate)

        // Initialize theme
        const savedTheme = localStorage.getItem("theme") as 'light' | 'dark' | 'grey'
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.classList.remove('dark', 'grey')
            if (savedTheme !== 'light') document.documentElement.classList.add(savedTheme)
        } else {
            document.documentElement.classList.add('dark')
        }

        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener('cartUpdated', handleCartUpdate)
        }
    }, [pathname])

    const toggleTheme = () => {
        let newTheme: 'light' | 'dark' | 'grey'
        if (theme === 'light') newTheme = 'grey'
        else if (theme === 'grey') newTheme = 'dark'
        else newTheme = 'light'

        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
        document.documentElement.classList.remove('dark', 'grey')
        if (newTheme !== 'light') document.documentElement.classList.add(newTheme)
    }

    const isCataloguePath = pathname === "/catalogue" || pathname.startsWith("/products/")
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/success"
    const showCart = cartItems.length > 0 && isCataloguePath && !isAuthPage

    useEffect(() => {
        // Handle responsive body padding for the permanent sidebar
        if (showCart) {
            document.body.style.transition = "padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            document.body.style.paddingRight = window.innerWidth >= 640 ? "24rem" : "100%"
        } else {
            document.body.style.paddingRight = "0px"
        }
    }, [showCart, cartItems.length])

    const handleSignOut = () => {
        logout()
        setUser(null)
        router.push("/")
        router.refresh()
    }

    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'web' | 'ecocash' | 'onemoney' | 'telecash'>('web')
    const [phone, setPhone] = useState('')
    const [location, setLocation] = useState('Harare')
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')

    const handleCheckout = async () => {
        const token = sessionStorage.getItem("token")
        if (!token) {
            window.location.href = `/register?redirect=${window.location.pathname}`
            return
        }
        
        setIsCheckingOut(true)

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"
            const checkoutUrl = baseUrl.endsWith("/api") ? baseUrl.replace("/api", "") + "/api/checkout" : `${baseUrl}/api/checkout`
            
            const checkoutRes = await fetch(checkoutUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    items: cartItems.map(item => ({ id: item.id, quantity: item.quantity })),
                    phone: phone,
                    method: paymentMethod,
                    location: location,
                    address: address,
                    notes: notes
                })
            })

            const paynowData = await checkoutRes.json()

            if (checkoutRes.ok) {
                if (paynowData.redirect_url) {
                    // Standard Web Payment: Redirect
                    sessionStorage.setItem("paynow_poll_url", paynowData.poll_url)
                    window.location.href = paynowData.redirect_url
                } else if (paynowData.poll_url) {
                    // Direct Mobile: Start Polling from Navbar
                    const pollInterval = setInterval(async () => {
                        try {
                            const statusRes = await fetch(`${baseUrl}/paynow/status`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ poll_url: paynowData.poll_url })
                            })
                            const status = await statusRes.json()
                            if (status.status === 'Paid') {
                                clearInterval(pollInterval)
                                window.location.href = "/success"
                            } else if (status.status === 'Cancelled' || status.status === 'Refused') {
                                clearInterval(pollInterval)
                                alert("Payment was rejected or cancelled.")
                                setIsCheckingOut(false)
                            }
                        } catch (e) {
                            console.error("Polling error:", e)
                        }
                    }, 5000) // Poll every 5s
                }
            } else {
                alert(paynowData.detail || paynowData.error || "Failed to process order.")
                setIsCheckingOut(false)
            }
        } catch (err) {
            console.error(err)
            alert("Error processing order.")
            setIsCheckingOut(false)
        }
    }

    // Hide navbar on the landing page and authentication pages
    if (isAuthPage) return null;

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Catalogue", href: "/catalogue" },
        { name: "Design Lab", href: "/design-lab" },
        { name: "About", href: "/about" },
        { name: "Admin Portal", href: "/admin" },
        { name: "System Monitor", href: "/monitor" },
    ]

    return (
        <>
        <nav
            className={cn(
                "fixed top-0 z-40 transition-all duration-300 px-6 py-4",
                showCart ? "w-full sm:w-[calc(100%-24rem)]" : "w-full",
                isScrolled ? "bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 py-3" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold tracking-tighter uppercase italic group">
                    T<span className="inline-block group-hover:rotate-12 transition-transform duration-300 text-accent">oo</span>fly
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks
                        .filter(link => {
                            if (link.href === "/admin") return user?.role === "owner";
                            if (link.href === "/monitor") return user?.role === "it_admin";
                            return true;
                        })
                        .map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "text-[11px] font-bold uppercase tracking-[0.2em] hover:text-accent transition-colors",
                                pathname === link.href ? "text-accent" : "text-gray-500"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <Search size={20} />
                    </button>
                    <button 
                        onClick={toggleTheme}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-accent"
                    >
                        {theme === 'light' ? <Sun size={20} /> : theme === 'grey' ? <Palette size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-accent">{user.role || 'Member'}</span>
                                <span className="text-[10px] font-bold lowercase opacity-60">{user.email}</span>
                            </div>
                            
                            {user.role === "it_admin" && (
                                <Link
                                    href="/admin"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-black dark:bg-white dark:text-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                                >
                                    <Crown size={12} />
                                    Portal
                                </Link>
                            )}

                            {user.role === "it_admin" && (
                                <Link
                                    href="/monitor"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                                >
                                    <Search size={12} />
                                    Monitor
                                </Link>
                            )}

                            <button
                                onClick={handleSignOut}
                                className="hidden md:block px-4 py-2 border border-black dark:border-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/login"
                                className="hidden md:block px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-black border-b border-black/5 dark:border-white/5 p-6 animate-reveal">
                    <div className="flex flex-col gap-6">
                        {navLinks
                            .filter(link => {
                                if (link.href === "/admin") return user?.role === "owner";
                                if (link.href === "/monitor") return user?.role === "it_admin";
                                return true;
                            })
                            .map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-xl font-bold uppercase italic tracking-tighter"
                            >
                                {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <button
                                onClick={() => {
                                    handleSignOut()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="flex items-center justify-center gap-2 px-6 py-4 border border-black dark:border-white text-xs font-bold uppercase tracking-[0.3em] rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-center gap-2 px-6 py-4 bg-black dark:bg-white dark:text-black text-white text-xs font-bold uppercase tracking-[0.3em] rounded-2xl"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
            {/* Slide-out Cart */}
            <AnimatePresence>
                {showCart && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-96 glass bg-white/90 dark:bg-black/90 z-40 shadow-2xl flex flex-col border-l border-white/10"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
                            <h2 className="text-xl font-bold uppercase tracking-widest italic">Catalogue Cart</h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {cartItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4">
                                        <ShoppingBag size={48} />
                                        <p className="text-xs uppercase font-bold tracking-[0.2em]">Your cart is empty.</p>
                                    </div>
                                ) : (
                                    cartItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 items-center">
                                            <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0">
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold uppercase tracking-widest">{item.name}</h4>
                                                <p className="text-[10px] text-accent font-bold uppercase tracking-wider mb-2">{item.category || "Apparel"}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold">${item.price} x {item.quantity}</span>
                                                    <button 
                                                        onClick={() => {
                                                            const updated = cartItems.filter((_, i) => i !== idx);
                                                            setCartItems(updated);
                                                            sessionStorage.setItem("cart", JSON.stringify(updated));
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {cartItems.length > 0 && (
                                <div className="p-6 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 mt-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-sm font-bold uppercase tracking-widest opacity-60">Total</span>
                                        <span className="text-2xl font-bold italic tracking-tighter">${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                                    </div>

                                    {/* Delivery Info Section */}
                                    <div className="space-y-4 mb-8 bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-center">Delivery Details</p>
                                        
                                        <div className="space-y-3">
                                            <div className="relative group">
                                                <select 
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-[10px] font-bold uppercase tracking-widest appearance-none focus:outline-none focus:border-accent text-center"
                                                >
                                                    <option value="Harare">Harare</option>
                                                    <option value="Bulawayo">Bulawayo</option>
                                                    <option value="Gweru">Gweru</option>
                                                    <option value="Mutare">Mutare</option>
                                                    <option value="Other">Other (Contact for shipping)</option>
                                                </select>
                                            </div>

                                            <input 
                                                type="text" 
                                                placeholder="Street Address, Suburb"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-accent text-center placeholder:opacity-30"
                                            />

                                            <input 
                                                type="text" 
                                                placeholder="Delivery Notes (Optional)"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-[10px] uppercase tracking-widest focus:outline-none focus:border-accent text-center placeholder:opacity-30"
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Method Selection */}
                                    <div className="space-y-4 mb-8">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-center">Payment System</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'web', name: 'Other / Card' },
                                                { id: 'ecocash', name: 'EcoCash' },
                                                { id: 'onemoney', name: 'OneMoney' },
                                                { id: 'telecash', name: 'TeleCash' }
                                            ].map((m) => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setPaymentMethod(m.id as any)}
                                                    className={cn(
                                                        "py-3 px-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border",
                                                        paymentMethod === m.id 
                                                            ? "bg-accent text-white border-accent shadow-lg shadow-accent/20 scale-105" 
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>

                                        {(paymentMethod === 'ecocash' || paymentMethod === 'onemoney' || paymentMethod === 'telecash') && (
                                            <div className="animate-reveal">
                                                <input 
                                                    type="tel" 
                                                    placeholder="07** *** ***"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-xs focus:outline-none focus:border-accent text-center font-mono placeholder:opacity-30"
                                                />
                                                <p className="text-[9px] text-gray-500 mt-2 text-center uppercase font-bold italic">Check your phone for the PIN prompt</p>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleCheckout}
                                        disabled={isCheckingOut || ((paymentMethod !== 'web') && !phone) || !address}
                                        className="w-full py-5 bg-white text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-accent hover:text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                                    >
                                        {isCheckingOut ? "Sending Request..." : "Secure Checkout"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
