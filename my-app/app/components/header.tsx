"use client"

import Link from "next/link"

export function Navigation() {
    return (
        <nav className="border-b border-neutral-100 bg-white">
            <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
                <div>
                    <Link href="/" className="text-lg font-medium tracking-tight hover:text-neutral-500 transition-colors">the niche</Link>
                </div>
                <div className="flex gap-12 text-sm font-medium">
                    <Link href="/articles" className="hover:text-neutral-500 transition-colors">Articles</Link>
                    <Link href="/companies" className="hover:text-neutral-500 transition-colors">Companies</Link>
                </div>
            </div>
        </nav>
    )
}