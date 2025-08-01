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
import { ProtectedContent } from "../components/protected-content"

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
      <ProtectedContent>
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white flex flex-col">
          <Navigation />
          <Container>
            <div className="py-16 flex flex-col gap-12 px-4 md:px-6 lg:px-8">
              {/* Two-column layout: left = intro + table, right = carousel */}
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left column: intro card + data table */}
                <div className="w-full md:flex-1 flex flex-col gap-8 max-w-3xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 mb-4">
                    <div className="text-left w-full">
  <p className="text-2xl font-semibold mb-2 text-neutral-800">introducing our partners</p>
  <div className="mb-6 text-base text-neutral-700">
    we&apos;ve highlighted some of the companies we&apos;re excited to be writing about in the next month, with more to be added. we&apos;ve exclusively partnered with these companies to provide you with a direct introduction, and we&apos;ll make the connect for you as soon as you indicate
    <span className="relative group inline-block align-middle mx-1">
      <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
        interest
      </span>
      <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-base text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
        for each company media profile, you&apos;ll have the opportunity to bookmark and indicate interest
      </span>
    </span>.
  </div>
  <p className="mb-6 text-base text-neutral-700">
    once you indicate interest, you&apos;ll need to update the required fields in your profile. if there is mutual interest with the startup, we will make the introduction within 72 hours – <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">let&apos;s get connecting!</span>
  </p>
</div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <DataTable columns={columns} data={tableData} />
                  </div>
                </div>
                {/* Right column: carousel */}
                <div className="hidden md:flex md:w-[380px] w-full flex-shrink-0 items-start">
                  <CompanyCarousel medias={carouselMedias} />
                </div>
              </div>
            </div>
           </Container>
        </div>
      </ProtectedContent>
    );
}
