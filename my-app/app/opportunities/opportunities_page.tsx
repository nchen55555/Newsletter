"use client"

import * as React from "react"
import Opportunities, { CompanyData } from "./opportunities_fetch_information"

type CompanyWithImageUrl = CompanyData & {
    imageUrl: string | null;
  };

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
}

interface OpportunitiesProp {
    featuredOpportunities: CompanyWithImageUrl[]
    posts: Post[]
}

export function LandingOpportunitiesClient({ featuredOpportunities, posts }: OpportunitiesProp) {

    return (
        <div className="flex flex-col justify-center items-center text-center min-h-screen w-full px-4">
            <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
                <Opportunities featuredOpportunities={featuredOpportunities} posts={posts} />
            </div>
        </div>
    )
}
