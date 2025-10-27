import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { CompanyData } from '@/app/types'
import { COMPANIES_QUERY, CACHE_OPTIONS } from '@/lib/sanity/queries'

export async function GET() {
  try {
    const builder = imageUrlBuilder(client)
    // Use centralized query and cache options
    const rawCompanies = await client.fetch(COMPANIES_QUERY, {}, CACHE_OPTIONS.COMPANIES)
    
    // Pre-generate image URLs for client component (same as companies page)
    const companies = rawCompanies.map((company: CompanyData) => ({
        ...company,
        imageUrl: company.image ? builder.image(company.image).width(300).height(200).url() : null
    }))

    return NextResponse.json(companies, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' // Cache for 10 min, revalidate in background for 5 min
      }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}
