"use client"


import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface Media {
    _id: string
    image: SanityImageSource
    alt: string
    description?: string
    caption?: string
    imageUrl: string
}

export default function CompanyCarousel({ medias }: { medias: Media[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cardHeight, setCardHeight] = useState(224); // default h-56
  const [gap, setGap] = useState(16); // default gap-4
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive card height and gap
  React.useEffect(() => {
    const updateSizes = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setCardHeight(224); // h-56
        setGap(32); // gap-8
      } else if (width >= 768) {
        setCardHeight(224); // h-56
        setGap(24); // gap-6
      } else {
        setCardHeight(224); // h-56
        setGap(16); // gap-4
      }
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  const VISIBLE_CARDS = 3;
  const totalCards = medias.length;

  React.useEffect(() => {
    if (paused || totalCards <= VISIBLE_CARDS) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % totalCards);
    }, 1200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, paused, totalCards]);

  // Only show each company once at a time
  const displayMedias = medias;

  // When reaching the end, reset to the top seamlessly
  const maxIndex = totalCards > VISIBLE_CARDS ? totalCards - VISIBLE_CARDS : 0;
  useEffect(() => {
    if (current > maxIndex) {
      setCurrent(0);
    }
  }, [current, maxIndex]);

  return (
    <div
      className="relative h-full w-full max-w-[380px] overflow-hidden flex flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ minHeight: `${cardHeight * VISIBLE_CARDS + gap * (VISIBLE_CARDS - 1)}px` }}
    >
      <div
        className={`flex flex-col transition-transform duration-700 gap-4 md:gap-6 xl:gap-8`}
        style={{ transform: `translateY(-${current * (cardHeight + gap)}px)` }}
      >
        {displayMedias.map((media, idx) => (
          <div
            key={media._id + '-' + idx}
            className="h-56 flex flex-col group cursor-pointer relative"
            style={{ minHeight: `${cardHeight}px`, maxHeight: `${cardHeight}px` }}
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden relative h-full w-full">
              <Image
                src={media.imageUrl}
                alt={media.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-500" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-xl font-medium text-white mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{media.alt}</h3>
                {media.caption && (
                  <p className="text-white/75 text-sm mb-1 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    {media.caption}
                  </p>
                )}
                {media.description && (
                  <p className="text-white/60 text-xs transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    {media.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

    