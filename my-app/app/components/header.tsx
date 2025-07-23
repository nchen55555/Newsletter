"use client"
import Link from "next/link"
import { NavActions } from "./navActions"

export function Navigation() {
    
    return (
        <nav className="border-b border-neutral-100 bg-white">
            <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
                <div className="flex items-center">
                    <Link href="/" className="text-lg font-medium tracking-tight hover:text-neutral-500 transition-colors">the niche</Link>
                </div>
                <div className="flex items-center gap-12 text-sm font-medium">
                    <Link href="/articles" className="py-2 hover:text-neutral-500 transition-colors">articles</Link>
                    <Link href="/companies" className="py-2 hover:text-neutral-500 transition-colors">companies</Link>
                    <NavActions />
                </div>
            </div>
        </nav>
    )
}