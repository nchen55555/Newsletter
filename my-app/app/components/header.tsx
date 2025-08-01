"use client"
import Link from "next/link"
import { NavActions } from "./navActions"

import { useState } from "react";
import { useSubscriptionContext } from "./subscription_context";

export function Navigation() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isSubscribed } = useSubscriptionContext();

    return (
        <nav className="border-b border-neutral-100 bg-white">
            <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
                <div className="flex items-center">
                    <Link href="/" className="text-lg font-medium tracking-tight transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">the niche</Link>
                </div>
                {/* Hamburger menu for mobile */}
                <button
                    className="md:hidden flex items-center px-2 py-1 border rounded text-neutral-700 border-neutral-300 hover:bg-neutral-100 focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-12 text-sm font-medium">
                    <Link href="/about" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">about</Link>
                    <Link href="/clients" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">pricing</Link>
                    {isSubscribed && (
                        <>
                            <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">portfolio</Link>
                            <Link href="/companies" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text">companies</Link>
                        </>
                    )}
                    <NavActions />
                </div>
            </div>
            {/* Mobile Nav Dropdown */}
            {menuOpen && (
                <div className="md:hidden px-8 pb-4 flex flex-col gap-4 text-sm font-medium bg-white border-b border-neutral-100 animate-fade-in-down">
                    <Link href="/about" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>about</Link>
                    {isSubscribed && (
                        <>
                            <Link href="/articles" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>portfolio</Link>
                            <Link href="/companies" className="py-2 transition-colors duration-200 hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:via-pink-400 hover:to-blue-400 hover:bg-clip-text" onClick={() => setMenuOpen(false)}>companies</Link>
                        </>
                    )}
                    <NavActions />
                </div>
            )}
        </nav>
    );
}