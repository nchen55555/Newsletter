"use client";
import { CompanyWithImageUrl } from "@/app/types";
import Image from "next/image";
import Link from "next/link";
import { client } from "@/lib/sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
  

interface CompanyCardProps {
  company: CompanyWithImageUrl;
}

export function CompanyCard({ company }: CompanyCardProps) {
  
  const { projectId, dataset } = client.config();
  const urlFor = (source: SanityImageSource) =>
    projectId && dataset
      ? imageUrlBuilder({ projectId, dataset }).image(source)
      : null;

  const imageUrl = company.image ? urlFor(company.image)?.url() || null : null;

  return (
    <Link href={`/companies/${company.company}`}>
      <div className="relative rounded-lg cursor-pointer w-full h-32 group overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={company.alt || `${company._id} logo`}
            fill
            className="object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-neutral-100 rounded-lg flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <span className="text-neutral-400 text-sm">No Logo</span>
          </div>
        )}
        
        {/* Gradient overlay that gets darker on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-80 transition-all duration-500 rounded-lg" />
        
        {/* Text content */}
        {company.caption && (
          <div className="absolute inset-0 p-3 flex flex-col justify-end">
            <p className="text-white text-xs transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 line-clamp-2">
              {company.caption}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}