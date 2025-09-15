"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";
import { CompanyData } from "@/app/types";
import ApplyButton from "@/app/components/apply";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

interface CompanyCardsProps {
  priority: CompanyWithImageUrl[];
  other: CompanyWithImageUrl[];
  external?: CompanyWithImageUrl[];
}


function PrimaryCTA({ companyId }: { companyId: string }) {
  return (
    <div className="relative">
      <div className="relative">
        <ApplyButton company={companyId} />
      </div>
    </div>
  );
}

export function CompanyCard({ company, showHighMutualInterest = false, external = false }: { company: CompanyWithImageUrl; showHighMutualInterest?: boolean; external?: boolean}) {
  const aboutId = useId();
  const router = useRouter();

  const facts = useMemo(() => {
    const arr: Array<{ label: string; value: string | number | undefined }> = [];
    if (company?.location) arr.push({ label: "Location", value: String(company.location) });
    if (company?.employees) arr.push({ label: "Headcount", value: String(company.employees) });
    if (company?.founded) arr.push({ label: "Founded", value: String(company.founded) });
    if (company?.stage) arr.push({ label: "Stage", value: String(company.stage) });
    if (company?.industry) arr.push({ label: "Industry", value: String(company.industry) });
    return arr.filter(Boolean).slice(0, 4);
  }, [company]);

  const title = company.alt || `Company ${company.company?.toString?.() ?? ""}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Overlay gradient removed */}
      
      {/* Badge */}
      {showHighMutualInterest && (
        <button
          className="absolute right-3 top-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-all cursor-pointer z-10"
        >
          High Mutual Interest Potential
        </button>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-100 bg-white/80 p-5 backdrop-blur supports-[backdrop-filter]:sticky supports-[backdrop-filter]:top-0">
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
          <h3 className="text-lg font-semibold leading-snug text-neutral-900 line-clamp-2 text-left">
            {title}
          </h3>
          {company.caption && (
            <p className="mt-0.5 text-sm leading-snug text-neutral-600 line-clamp-2 text-left">
              {company.caption}
            </p>
          )}
        </div>
      </div>

      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">        
        {/* Facts (wrap, no truncate) */}
        {facts.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-700 md:grid-cols-4">
            {facts.map((f) => (
              <li key={f.label} className="break-words">
                <span className="text-neutral-500">{f.label}: </span>
                <span className="font-medium text-neutral-800">{f.value}</span>
              </li>
            ))}
          </ul>
        )}

        {/* About — clamped when collapsed; full when expanded */}
        {company.description && (
          <div>
            <p
              id={aboutId}
              className={[
                "text-sm leading-relaxed text-neutral-700 text-left",
              ].join(" ")}
            >
              {company.description}
            </p>
           <div className ="mt-4 text-left">
          {company.tags?.length ? (
            <button
            type="button"
            onClick={() => router.push(`/${company.tags?.[0]}`)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 transition-colors duration-200 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
            aria-controls={aboutId}
          >
            Our Company Profile <ArrowRight className="h-4 w-4 transition-transform hover:translate-x-0.5" />
          </button>
            
          ) : null}
          </div>
          </div>
        )}
      </div>

      {/* Footer — All buttons on the left */}
     
      <div className="mt-auto border-t border-neutral-100 bg-neutral-50/80 p-5">
        <div className="flex items-center gap-4 justify-start">
          <div className="shrink-0">
            <RainbowBookmark company={company.company} /> 
          </div>
          {!external &&(
          <div className="shrink-0">
            <PrimaryCTA companyId={company.company.toString()} />
          </div>)}
        </div>
      </div>
    </article>
  );
}

export default function CompanyCards({ priority, other, external = [] }: CompanyCardsProps) {
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
            {priority.length === 0 ? (
              <Alert className="max-w-2xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your recommendations may still be generating - check back 2-3 days after you submitted your profile.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-2">
                {priority.map((company) => (
                  <CompanyCard key={company._id} company={company} showHighMutualInterest={true} external={false} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'other' && (
          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-3">
            {other.map((company) => (
              <CompanyCard key={company._id} company={company} external={false}/>
            ))}
          </div>
        )}

        {activeTab === 'external' && (
          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-3">
            {external.map((company) => (
              <CompanyCard key={company._id} company={company} external={true}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
