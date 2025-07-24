import * as React from "react"
import { Navigation } from "@/app/components/header"
import { Container } from "@/app/components/container"
import { client } from "@/lib/sanity/client"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import imageUrlBuilder from "@sanity/image-url"
import CompanyCarousel from "../components/company_carousel"
import { DataTable } from "./company_data_table"
import { columns } from "./company_columns"

export default async function CarouselSize() {
    const MEDIA_QUERY = `*[
        _type == "mediaLibrary"
      ][0...12]{
        _id,
        publishedAt,
        image,
        alt,
        caption,
        description,
        tags
      }`;

    const builder = imageUrlBuilder(client)
    interface SanityMedia extends SanityDocument {
        image: SanityImageSource
        alt: string
        caption?: string
        description?: string
        tags?: string[]
    }

    const rawMedias = await client.fetch<SanityMedia[]>(MEDIA_QUERY, {})

    // Pre-generate image URLs
    const carouselMedias = rawMedias.map(media => ({
        _id: media._id,
        image: media.image,
        alt: media.alt,
        caption: media.caption,
        description: media.description,
        tags: media.tags,
        imageUrl: builder.image(media.image).url()
    }))

    const tableData = rawMedias.map(media => ({
        id: media._id,
        alt: media.alt,
        caption: media.caption || '',
        description: media.description || '',
        image: builder.image(media.image).url(),
        tags: media.tags || [],
        publishedAt: media.publishedAt || ''
    }))
      
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
                <div className="pt-12 pb-16 relative">
                    <h1 className="text-6xl font-medium tracking-tight mb-8 relative inline-block">
                        <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-neutral-950 via-neutral-800 to-neutral-600 animate-gradient">
                        spotlights
                        </span>
                        <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
                    </h1>
                    <p className="text-neutral-600 mb-6"><em>publishing full list of portfolio companies soon - for now, here are some spotlights that we plan on covering</em></p> 
                    <CompanyCarousel medias={carouselMedias} />
                    <h2 className="text-xl font-medium tracking-tight mb-6 mt-12 relative inline-block">
                        <span className="relative z-10">all companies</span>
                        <span className="absolute inset-0 bg-yellow-200/50 -rotate-1 rounded-lg transform -skew-x-6" />
                    </h2>
                    <DataTable columns={columns} data={tableData} />
                </div>
            </Container>
        </div>  
    )
}
