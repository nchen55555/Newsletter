"use client"
import Link from "next/link"
import { NavActions } from "./navActions"

export function Navigation() {
    
    return (
        <nav className="border-b border-neutral-100 bg-white">
            <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
                <div className="flex items-center">
                    <Link href="/" className="text-lg font-medium tracking-tight transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">the niche</Link>
                </div>
                <div className="flex items-center gap-12 text-sm font-medium">
                    <Link href="/about" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">about</Link>
                    <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">portfolio</Link>
                    <Link href="/companies" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">companies</Link>
                    <NavActions />
                </div>
            </div>
        </nav>
    )
}