"use client"

import { Subscribe } from "./subscribe";


export function Introduction(){
    return (
        <div>
            <p className="text-neutral-600 mb-6">a newsletter-turned-marketplace that helps students discover and connect with (wouldn't uk it) top, niche startups 📰 </p>
            <p className="text-neutral-600 mb-6">each week (so much writing ahh), we break down one company (product, marketing, gtm strat, ...) to actually UNDERSTAND the company (not the VC buzzwords they put on their website) 👀 </p>
            <p className="text-neutral-600 mb-6">as we grow, so does the nic(h)e list: a curated set of high-growth partner startups you can actually apply to through us!</p>
            <Subscribe />
        </div>
    );
}