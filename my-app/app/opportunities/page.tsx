import * as React from "react"
import { SidebarLayout } from "@/app/components/sidebar-layout"
import { ProtectedContent } from "../components/protected-content"
import { LandingOpportunitiesClient}  from "./opportunities_page"
import { CompanyData } from "@/app/types"
import imageUrlBuilder from "@sanity/image-url"
import { client } from "@/lib/sanity/client"
import { COMPANIES_QUERY, CACHE_OPTIONS } from "@/lib/sanity/queries"
import { Container } from "@/app/components/container"

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const builder = imageUrlBuilder(client)
  const rawCompanies = await client.fetch<CompanyData[]>(COMPANIES_QUERY, {}, CACHE_OPTIONS.COMPANIES)

  // Pre-generate image URLs for client component
  const companies = rawCompanies.map(company => ({
      ...company,
      imageUrl: company.image ? builder.image(company.image).width(300).height(200).url() : null
  }))

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const flowParam = resolvedSearchParams?.flow
  const flow = Array.isArray(flowParam) ? flowParam[0] : flowParam
  const showIntro = flow === 'introduction'


    return (
      <ProtectedContent>
        <SidebarLayout title="Opportunities">
          <Container>
            {/* Header Section */}
            <LandingOpportunitiesClient
              featuredOpportunities={companies}
              showIntro={showIntro}
            />
          </Container>
        </SidebarLayout>
      </ProtectedContent>
    )
}