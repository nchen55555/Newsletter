"use client"

import * as React from "react"
import Opportunities, { CompanyData } from "./opportunities_fetch_information"

type CompanyWithImageUrl = CompanyData & {
    imageUrl: string | null;
  };

interface OpportunitiesProp {
    featuredOpportunities: CompanyWithImageUrl[]
}

export function LandingOpportunitiesClient({ featuredOpportunities }: OpportunitiesProp) {

    return (
        <div className="flex flex-col justify-center items-center text-center min-h-screen w-full px-4">
            <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
                <Opportunities featuredOpportunities={featuredOpportunities} />
            </div>
        </div>
    )
}
