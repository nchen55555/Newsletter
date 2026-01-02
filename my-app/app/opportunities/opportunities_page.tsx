"use client"

import * as React from "react"
import Opportunities, { CompanyData } from "./opportunities_fetch_information"
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

type CompanyWithImageUrl = CompanyData & {
    imageUrl: string | null;
  };

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  image?: SanityImageSource;
  publishedAt: string;
}

interface OpportunitiesProp {
    featuredOpportunities: CompanyWithImageUrl[]
}

export function LandingOpportunitiesClient({ featuredOpportunities }: OpportunitiesProp) {

    return (
        <Opportunities featuredOpportunities={featuredOpportunities} />
    )
}
