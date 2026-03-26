import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Toofly | Role-Based Fashion Hub",
  description: "Fluid silhouettes meets digital permanence. Curated streetwear for the discerning collective.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.variable} font-sans antialiased selection:bg-accent selection:text-white`}>
        <Navbar />
        {children}

        {/* Simple Footer */}
        <footer className="py-20 px-6 border-t border-black/5 dark:border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xl font-bold tracking-tighter uppercase italic">
              T<span className="text-accent">oo</span>fly
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-black dark:hover:text-white transition-colors">X / Twitter</a>
              <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Discord</a>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              © 2026 Toofly Collective
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
