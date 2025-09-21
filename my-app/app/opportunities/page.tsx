import * as React from "react"
import { Navigation } from "@/app/components/header"
import { ProtectedContent } from "../components/protected-content"
import { LandingOpportunitiesClient}  from "./opportunities_page"
import { CompanyData } from "@/app/types"
import imageUrlBuilder from "@sanity/image-url"
import { client } from "@/lib/sanity/client"




export default async function OpportunitiesPage() {

  const COMPANIES_QUERY = `*[
    _type == "mediaLibrary"
  ]{
    _id,
    company,
    image,
    publishedAt,
    alt,
    caption,
    description,
    tags,
    hiring_tags,
    location,
    employees,
    founded,
    stage,
    industry,
    partner, 
    pending_partner,
    external_media, 
    people, 
    location
  }`;

const builder = imageUrlBuilder(client)
const rawCompanies = await client.fetch<CompanyData[]>(COMPANIES_QUERY, {})


// Pre-generate image URLs for client component
const companies = rawCompanies.map(company => ({
    ...company,
    imageUrl: company.image ? builder.image(company.image).width(300).height(200).url() : null
}))

    return (
      <ProtectedContent>
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
          <Navigation />
          <div className="flex-1 flex items-center justify-center px-8">
            {/* Header Section */}
            <LandingOpportunitiesClient featuredOpportunities={companies}/>
          </div>
        </div>
      </ProtectedContent>
    )
}