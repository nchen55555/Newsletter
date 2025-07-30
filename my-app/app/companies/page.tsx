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
        <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
            <Navigation />
            <Container>
              <div className="flex flex-col md:flex-row gap-12 pt-12 pb-16 relative">
                {/* Main content left */}
                <div className="flex-1 min-w-0 pt-4 pb-16">
                  <div className="text-neutral-600 text-2xl leading-relaxed mb-10 text-left">
                    <p className="mb-6">
                      the niche is a newsletter-turned-marketplace for
                      <span className="relative group inline-block align-middle mx-1">
                        <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                          an exclusive cohort of students
                        </span>
                        <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                          100 students from Harvard, MIT, Stanford, and Berkeley, hand-picked through academic and industry recommendations
                        </span>
                      </span>
                      that we&#39;ve chosen
                    </p>
                    <p className="mb-6">we&#39;ve highlighted some of the companies we&#39;re excited to be writing about in the next month with more to be added. please <span className="relative group inline-block align-middle mx-1">
                        <span className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 px-2 py-1 rounded transition-colors duration-300">
                          refrain from personally reaching out
                        </span>
                        <span className="absolute left-0 top-full mt-2 min-w-[220px] max-w-screen-sm w-auto bg-white border border-neutral-200 rounded shadow-md px-4 py-2 text-lg text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 z-10 break-words whitespace-pre-line">
                          we&#39;ve put a lot of trust into our cohort. if a company would like to make a connect, we will reach out to you. otherwise, they do not and it will only reflect badly on our platform if you reach out accordingly
                        </span>
                      </span> to these companies. <strong>we will make the connect for you</strong></p>
                  </div>
                  <div className="w-full mb-10">
                    <DataTable columns={columns} data={tableData} />
                  </div>
                </div>
                {/* Vertical company cards right sidebar */}
                <div className="hidden md:block w-full max-w-[380px] flex-shrink-0 sticky top-28 self-start">
                  <CompanyCarousel medias={carouselMedias} />
                </div>
              </div>
            </Container>
        </div>  
        </ProtectedContent>
    )
}
