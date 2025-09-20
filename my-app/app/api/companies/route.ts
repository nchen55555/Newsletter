import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { CompanyData } from '@/app/types'

export async function GET() {
  try {
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
        partner, 
        pending_partner,
        external_media,
        people
      }`;

    const builder = imageUrlBuilder(client)
    const rawCompanies = await client.fetch(COMPANIES_QUERY, {})
    
    // Pre-generate image URLs for client component (same as companies page)
    const companies = rawCompanies.map((company: CompanyData) => ({
        ...company,
        imageUrl: company.image ? builder.image(company.image).width(300).height(200).url() : null
    }))

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}
