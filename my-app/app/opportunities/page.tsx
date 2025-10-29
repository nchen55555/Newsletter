import * as React from "react"
import { Navigation } from "@/app/components/header"
import { ProtectedContent } from "../components/protected-content"
import { LandingOpportunitiesClient}  from "./opportunities_page"
import { CompanyData } from "@/app/types"
import imageUrlBuilder from "@sanity/image-url"
import { client } from "@/lib/sanity/client"
import { COMPANIES_QUERY, CACHE_OPTIONS } from "@/lib/sanity/queries"

export default async function OpportunitiesPage() {
  const builder = imageUrlBuilder(client)
  const rawCompanies = await client.fetch<CompanyData[]>(COMPANIES_QUERY, {}, CACHE_OPTIONS.COMPANIES)

  // Fetch posts for the ticker
  const POSTS_QUERY = `*[_type == "post" 
  && defined(slug.current)
  && !(slug.current match "*-beta*")
  ]|order(publishedAt desc)[0...6]{_id, title, slug, image, publishedAt}`;
  
  let posts = [];
  try {
    posts = await client.fetch(POSTS_QUERY, {}, CACHE_OPTIONS.POSTS || { next: { revalidate: 300 } });
  } catch (error) {
    console.warn('⚠️ Could not fetch posts for ticker', error);
    posts = [];
  }

  // Pre-generate image URLs for client component
  const companies = rawCompanies.map(company => ({
      ...company,
      imageUrl: company.image ? builder.image(company.image).width(300).height(200).url() : null
  }))


    return (
      <ProtectedContent>
        <div className="min-h-screen flex flex-col" style={{
          background: `
            radial-gradient(ellipse 700px 500px at 85% 15%, rgba(34, 197, 94, 0.3) 0%, rgba(124, 211, 87, 0.25) 15%, rgba(253, 224, 71, 0.3) 35%, rgba(253, 224, 71, 0.2) 60%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 1) 100%),
            white
          `
        }}>
          <Navigation />
          <div className="flex-1 flex items-center justify-center px-8">
            {/* Header Section */}
            <LandingOpportunitiesClient featuredOpportunities={companies} posts={posts}/>
          </div>
        </div>
      </ProtectedContent>
    )
}