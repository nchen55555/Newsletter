"use client"

import * as React from "react"
import Opportunities, { CompanyData } from "./opportunities_fetch_information"
import { useState } from "react"

type CompanyWithImageUrl = CompanyData & {
    imageUrl: string | null;
  };

interface OpportunitiesProp {
    featuredOpportunities: CompanyWithImageUrl[]
}

export function LandingOpportunitiesClient({ featuredOpportunities }: OpportunitiesProp) {
    const [showExploreContent, setShowExploreContent] = useState(false)

    return (
        <div className="flex flex-col justify-center items-center text-center min-h-screen w-full px-4">
            {/* Explore Button */}
            {!showExploreContent && (
                <div>
                <h1 className="text-4xl md:text-6xl font-normal mb-6 text-black leading-tight tracking-tight">
                Your Database of Opportunities
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 leading-relaxed font-light max-w-3xl mx-auto mb-8">
                Connect, discover, and grow with a personalized and verified professional network of opportunities. In this public beta, opportunities partnered with The Niche are fast-tracked and go straight to the founder&apos;s inbox. If there is mutual interest from them, we immediately connect you straight to them. Non-partner companies are just a resource for you to explore. 
            </p>
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowExploreContent(true)}
                        className="bg-black text-white px-8 py-3 rounded-full font-medium text-lg hover:bg-neutral-800 transition-all duration-300 transform hover:scale-105"
                    >
                        Explore
                    </button>
                </div>
                </div>
            )}
            {showExploreContent && (
                <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
                    <Opportunities featuredOpportunities={featuredOpportunities} />
                </div>
            )}
        </div>
    )
}
