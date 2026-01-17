"use client"

import * as React from "react"
import Opportunities, { CompanyData } from "./opportunities_fetch_information"

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

interface OpportunitiesProp {
  featuredOpportunities: CompanyWithImageUrl[]
  showIntro?: boolean
}

export function LandingOpportunitiesClient({
  featuredOpportunities,
  showIntro = false,
}: OpportunitiesProp) {
  return (
    <Opportunities
      featuredOpportunities={featuredOpportunities}
      showIntro={showIntro}
    />
  )
}
