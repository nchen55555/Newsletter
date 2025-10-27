"use client"

import Image from "next/image";
import { client } from "@/lib/sanity/client";
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

interface MediaLibraryItem {
  _id: string;
  image: SanityImageSource;
  alt: string;
  company: string;
}

interface CompanyShowcaseProps {
  mediaLibrary: MediaLibraryItem[];
}

export default function CompanyShowcase({ mediaLibrary }: CompanyShowcaseProps) {
  const builder = imageUrlBuilder(client);
  
  function urlForImage(source: SanityImageSource) {
    return builder.image(source);
  }

  // Debug: log the mediaLibrary to see what companies we have
  console.log('CompanyShowcase mediaLibrary:', mediaLibrary.map(item => ({ id: item._id, company: item.company, alt: item.alt })));

  // Find unify and moment by company field - try different variations
  let unify = mediaLibrary.find(item => item.company === "6" || item.company === "unify" || item.alt?.toLowerCase().includes('unify'));
  let moment = mediaLibrary.find(item => item.company === "7" || item.company === "moment" || item.alt?.toLowerCase().includes('moment'));

  // If we can't find them, just use the first two items for testing
  if (!unify || !moment) {
    console.log('Could not find unify/moment, using first two items');
    unify = mediaLibrary[0];
    moment = mediaLibrary[1];
  }

  if (!unify || !moment) {
    return <div className="text-center py-8">
      <p className="text-red-500">Debug: No media items found. Total items: {mediaLibrary.length}</p>
    </div>;
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Unify Card */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 w-80">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src={urlForImage(unify.image).width(150).height(60).url()}
              alt={unify.alt}
              width={150}
              height={60}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-black mb-3">unify</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              ex-Scale and cto Connor Heggie partners with<br />
              The Niche to pioneer Unify&apos;s first new-grad<br />
              and intern class
            </p>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0">
        <svg 
          width="80" 
          height="60" 
          viewBox="0 0 80 60" 
          fill="none" 
          className="text-black"
        >
          <path 
            d="M15 30L65 30M55 20L65 30L55 40" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Moment Card */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 w-80">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src={urlForImage(moment.image).width(150).height(60).url()}
              alt={moment.alt}
              width={150}
              height={60}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-black mb-3">moment</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              ex-Citadel quant trader and founder Dylan<br />
              Parker partners with The Niche to connect<br />
              and intro with the best technical talent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}