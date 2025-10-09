"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { CompanyData } from "@/app/types";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import Post from "../components/post";
import Share from "../components/share";

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};


export function CompanyRow({ company, potential = false }: { company: CompanyWithImageUrl; potential?: boolean}) {
  const router = useRouter();

  useEffect(() => {
    const checkAppliedStatus = async () => {
      try {
        await fetch('/api/get_profile', { credentials: 'include' });
      } catch (error) {
        console.error('Error checking applied status:', error);
      }
    };

    checkAppliedStatus();
  }, []);


  const title = company.alt || `Company ${company.company?.toString?.() ?? ""}`;

  return (
    <div 
      className="group relative flex items-start gap-6 p-6 border border-neutral-200 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 min-h-[140px]"
      onClick={() => router.push(`/companies/${company.company}`)}
    >
      {/* Company Logo */}
      <div className="flex-shrink-0">
        <div className="grid h-20 w-24 place-items-center overflow-hidden rounded-lg bg-neutral-100">
          {company.imageUrl ? (
            <Image
              src={company.imageUrl}
              alt={company.alt || `Logo for ${title}`}
              width={96}
              height={80}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="text-xl font-semibold text-neutral-600">
              {title?.charAt(0)?.toUpperCase?.() || "C"}
            </div>
          )}
        </div>
      </div>

      {/* Company Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4 h-full">
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-lg font-semibold text-neutral-900 text-left group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:via-pink-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-colors duration-200">
              {title}
            </h3>
            {company.caption && (
              <p className="mt-1 text-sm text-neutral-600 line-clamp-1 text-left">
                {company.caption}
              </p>
            )}

            {/* Description */}
            {company.description && (
              <p className="mt-2 text-sm text-neutral-700 line-clamp-3 text-left leading-relaxed">
                {company.description}
              </p>
            )}
            
            {/* Location */}
            {company.location && (
              <div className="mt-2 text-sm text-neutral-600 text-left">
                📍 {company.location}
              </div>
            )}

            {/* Hiring tags */}
            {company.hiring_tags && company.hiring_tags.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {company.hiring_tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200"
                    >
                      {tag}
                    </span>
                  ))}
                  {company.hiring_tags.length > 3 && (
                    <span className="text-xs text-neutral-500 px-2 py-0.5">
                      +{company.hiring_tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Pending partnership tag */}
            {potential && (
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                  Partnership Coming Soon
                </span>
              </div>
            )}
            {/* Pending partnership tag */}
            {!company.partner && (
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                  Not A Partner
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-between items-end flex-shrink-0 h-full">
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-end gap-2">
                <RainbowBookmark company={company.company}/>
                <div onClick={(e) => e.stopPropagation()}>
                  <Share company={company.company} />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Post company={company.company} companyData={company} />
                </div>
              </div>

              {company.external_media && (
                <a
                  href={company.external_media}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:text-neutral-800"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
          
          </div>
        </div>
      </div>
    </div>
  );
}