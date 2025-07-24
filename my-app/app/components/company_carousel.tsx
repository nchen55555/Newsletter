"use client"

import { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";

interface Media {
    _id: string
    image: SanityImageSource
    alt: string
    description?: string
    caption?: string
    imageUrl: string
}

export default function CompanyCarousel({ medias }: { medias: Media[] }) {
    const [slidesPerView, setSlidesPerView] = useState(1)

    useEffect(() => {
        const updateSlidesPerView = () => {
            const width = window.innerWidth
            if (width < 640) { // sm
                setSlidesPerView(1)
            } else if (width < 1024) { // md
                setSlidesPerView(2)
            } else if (width < 1280) { // lg
                setSlidesPerView(3)
            } else { // xl and above
                setSlidesPerView(4)
            }
        }

        // Initial calculation
        updateSlidesPerView()

        // Update on resize
        window.addEventListener('resize', updateSlidesPerView)
        return () => window.removeEventListener('resize', updateSlidesPerView)
    }, [])

    return (
        <Carousel
            opts={{
                align: "start",
                dragFree: true,
                containScroll: "trimSnaps"
            }}
            className="w-full max-w-7xl mx-auto px-4"
        >
            <CarouselContent className="-ml-4">
                {medias.map((media) => (
                    <CarouselItem 
                        key={media._id} 
                        className="pl-4 pb-6"
                        style={{ flex: `0 0 ${100 / slidesPerView}%` }}
                    >
                        <div className="group relative overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 mb-2">
                            <div className="aspect-[4/3] w-full overflow-hidden">
                                <Image
                                    src={media.imageUrl}
                                    alt={media.alt}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-lg font-medium tracking-tight">{media.alt}</h3>
                                    <p className="mt-2 text-sm text-neutral-200">
                                        {media.description || media.caption}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="-left-12 md:-left-16" />
            <CarouselNext className="-right-12 md:-right-16" />
        </Carousel>
    )
}
    