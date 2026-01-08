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
        <Opportunities featuredOpportunities={featuredOpportunities} />
    )
}
