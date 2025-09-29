"use client";

import { useId, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { CompanyData } from "@/app/types";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

interface CompanyCardsProps {
  priority: CompanyWithImageUrl[];
  bookmarks:CompanyWithImageUrl[];
  other: CompanyWithImageUrl[];
  external?: CompanyWithImageUrl[];
  pendingPartner?: CompanyWithImageUrl[];
}


export function CompanyCard({ company, showHighMutualInterest = false, potential = false}: { company: CompanyWithImageUrl; showHighMutualInterest?: boolean; potential?: boolean, external?: boolean}) {
  const aboutId = useId();
  const router = useRouter();
  const [appliedToNiche, setAppliedToNiche] = useState(false);

  // Check if user has applied to The Niche
  useEffect(() => {
    const checkAppliedStatus = async () => {
      try {
        const res = await fetch('/api/get_profile', { credentials: 'include' });
        if (res.ok) {
          const profile = await res.json();
          setAppliedToNiche(profile.verified || false);
        }
      } catch (error) {
        console.error('Error checking applied status:', error);
      }
    };

    checkAppliedStatus();
  }, []);

  const title = company.alt || `Company ${company.company?.toString?.() ?? ""}`;

  return (
    <article 
      className="group relative flex h-80 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
      onClick={() => appliedToNiche ? router.push(`/companies/${company.company}`) : null}
    >
      {/* Badge */}
      {showHighMutualInterest && company.partner && (
        <button
          className="mb-6 absolute right-3 top-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-all cursor-pointer z-10"
        >
          High Potential Mutual Interest
        </button>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-100 bg-white/80 p-5 pt-12 backdrop-blur supports-[backdrop-filter]:sticky supports-[backdrop-filter]:top-0">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-20 w-28 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-neutral-100">
          {company.imageUrl ? (
            <Image
              src={company.imageUrl}
              alt={company.alt || `Logo for ${title}`}
              width={112}   // match w-28
              height={80}   // match h-20
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="text-xl font-semibold text-neutral-600">
              {title?.charAt(0)?.toUpperCase?.() || "C"}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug text-neutral-900 line-clamp-2 text-left group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:via-pink-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-colors duration-200">
            {title}
          </h3>
          {company.caption && (
            <p className="mt-0.5 text-sm leading-snug text-neutral-600 line-clamp-2 text-left">
              {company.caption}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <RainbowBookmark company={company.company} /> 
      </div>

      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 px-4 pt-3 pb-2">          

        {/* About — clamped when collapsed; full when expanded */}
        {company.description && (
          <div>
            <p
              id={aboutId}
              className={[
                "text-sm leading-relaxed text-neutral-700 text-left line-clamp-3",
              ].join(" ")}
            >
              {company.description}
            </p>
            
            {/* Hiring tags */}
            {company.hiring_tags && company.hiring_tags.length > 0 && (
              <div className="mt-2 mb-1 text-left">
                <div className="flex flex-wrap gap-1.5">
                  {company.hiring_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pending partnership tag for potential companies */}
            {potential && (
              <div className="mt-2 mb-1 text-left">
                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 border border-yellow-200">
                  Partnership Coming Soon
                </span>
              </div>
            )}
            
           {/* <div className ="mt-4 text-left">
          {company.tags?.length && appliedToNiche && !disableProfile && (
            <button
            type="button"
            onClick={() => router.push(`/${company.tags?.[0]}`)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 transition-colors duration-200 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
            aria-controls={aboutId}
          >
            Our Company Profile <ArrowRight className="h-4 w-4 transition-transform hover:translate-x-0.5" />
          </button>
            
          )}
          </div> */}

          {/* Website, Location and Employee Links Section */}
          {(company.external_media || company.location || (company.people && company.people.length > 0)) && (
            <div className="mt-2 mb-4 text-left relative">
              <div className="flex justify-between items-end">
 
                {/* Location */}
                {company.location && (
                  <div className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700">
                    {/* <MapPin className="h-3 w-3" /> */}
                    📍 {company.location}
                  </div>
                )}

              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Footer — All buttons on the left */}
     
      {/* <div className="mt-auto border-t border-neutral-100 bg-neutral-50/80 p-5">
        <div className="flex items-center gap-4 justify-start">
          <div className="shrink-0">
            <RainbowBookmark company={company.company} /> 
          </div>
          {company.partner && !potential && (
          <div className="shrink-0">
            <PrimaryCTA companyId={company.company.toString()} />
          </div>)}
          {potential && (
          <div className="shrink-0">
            <EarlyInterestCTA companyId={company.company.toString()} />
          </div>)}
        </div>
      </div> */}
    </article>
  );
}

export default function CompanyCards({ priority, bookmarks, other, external = [], pendingPartner = [] }: CompanyCardsProps) {
  const [activeTab, setActiveTab] = useState<'priority' | 'other' | 'external'>('priority');

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 mb-8">
        <button
          onClick={() => setActiveTab('priority')}
          className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'priority'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          For You on The Niche
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'other'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Opportunites on The Niche with Our Partners
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'external'
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Other Opportunities Beyond The Niche
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'priority' && (
          <>
            {priority.length === 0 || bookmarks.length === 0 ? (
              <Alert className="max-w-2xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your recommendations are still generating. Expand your verified network and bookmark/connect with companies that interest you to get more personalized recommendations here.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-2">
                {priority.map((company) => (
                  <CompanyCard key={company._id} company={company} showHighMutualInterest={true} external={false}/>
                ))}
                {bookmarks.map((company) => (
                  <CompanyCard key={company._id} company={company} showHighMutualInterest={false} external={false}/>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'other' && (
          <>
            <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-2">
              {other.map((company) => (
                <CompanyCard key={company._id} company={company} external={false}/>
              ))}
            </div>
            
            <div className="mt-8">
              <div className="text-center mb-6">
                <p className="text-lg font-medium text-neutral-600"><strong>Pending partnerships coming soon... </strong></p>
              </div>
              <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-2">
                {pendingPartner.map((company) => (
                  <CompanyCard key={company._id} company={company} potential={true} external={false}/>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'external' && (
          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-2">
            {external.map((company) => (
              <CompanyCard key={company._id} company={company} external={true}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
