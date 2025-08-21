import * as React from "react"
import { Navigation } from "@/app/components/header"
import { Container } from "@/app/components/container"
import { client } from "@/lib/sanity/client"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import imageUrlBuilder from "@sanity/image-url"
import { ProtectedContent } from "../components/protected-content"
import { CompanyTable } from "./company-table"

export interface CompanyData extends SanityDocument {
  company: number
  image?: SanityImageSource
  publishedAt: string
  alt?: string
  caption?: string
  description?: string
  tags?: string[]
}

export default async function PortfolioPage() {
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
        tags
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
          <Container>
            <div className="max-w-6xl mx-auto py-16">
              {/* Header Section */}
              <div className="mb-10">
                <h1 className="text-4xl font-bold mb-4 text-neutral-800">
                  introducing our partners
                </h1>
                <p className="text-lg text-neutral-600 mb-10">
                  we&apos;ve highlighted some of the companies we&apos;re excited to be writing about in the next month, with more to be added. we&apos;ve exclusively partnered with these companies to provide you with a 
                  <span className="relative group inline-block align-middle mx-1">
                    <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                      direct introduction
                    </span>
                    <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                      for each company media profile, you&apos;ll have the opportunity to bookmark and apply
                    </span>
                  </span>, and we&apos;ll make the connect for you as soon as you indicate interest.
                </p>
                <p className="text-lg text-neutral-600 mb-10">
                  once you indicate interest on the company profile, you&apos;ll be directed to update your profile and submit your application. if there is mutual interest with the startup, we will make the introduction within 72 hours – 
                  <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">let&apos;s get connecting!</span>
                </p>
              </div>

              {/* Portfolio Table */}
              <CompanyTable companies={companies} />
            </div>
          </Container>
        </div>
      </ProtectedContent>
    );
}
