"use client"

import { Subscribe } from "./subscribe";


export function Introduction(){
    return (
        <div>
            <p className="text-neutral-600 mb-6"> the marketplace-turned-newsletter for you to shop for today&#39;s highest-growth startups </p> 
            <p className="text-neutral-600 mb-6"> every week, we break down one company - their product, marketing, GTM  - to actually understand their trajectory and <strong>connect you with the founding team to see if there is mutual fit</strong> </p> 
            <p className="text-neutral-600 mb-6"><em>we start with a cohort of 100 students hand-picked to launch the niche. you&#39;re one of them</em></p> 
            <Subscribe />
        </div>
    );
}