"use client";

import { useId, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CompanyData } from "@/app/types";
import ApplyButton from "@/app/components/apply";
import RainbowBookmark from "@/app/components/rainbow_bookmark";

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

interface CompanyCardsProps {
  companies: CompanyWithImageUrl[];
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

function CompanyCard({ company }: { company: CompanyWithImageUrl }) {
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
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
          <h3 className="text-lg font-semibold leading-snug text-neutral-900 line-clamp-2">
            {title}
          </h3>
          {company.caption && (
            <p className="mt-0.5 text-sm leading-snug text-neutral-600 line-clamp-2">
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
            <h4 className="mb-1 text-sm font-semibold text-neutral-900">About</h4>
            <p
              id={aboutId}
              className={[
                "text-sm leading-relaxed text-neutral-700",
              ].join(" ")}
            >
              {company.description}
            </p>
            <div className="flex flex-wrap items-center gap-2">
          {company.tags?.length ? (
            <button
            type="button"
            onClick={() => router.push(`/${company.tags?.[0]}`)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            aria-controls={aboutId}
          >
            {"Read more"}
          </button>
            
          ) : null}
            </div>
            
          </div>
        )}
      </div>

      {/* Footer — Bookmark left, Apply right */}
      <div className="mt-auto border-t border-neutral-100 bg-neutral-50/80 p-5">
        <div className="flex items-center justify-between">
          <div className="shrink-0">
            <RainbowBookmark company={company.company} />
            
          </div>
         
          <div className="shrink-0">
            <PrimaryCTA companyId={company.company.toString()} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CompanyCards({ companies }: CompanyCardsProps) {
  return (
    // Bigger cards (2-up on large screens), stretch rows to equal height
    <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-2">
      {companies.map((company) => (
        <CompanyCard key={company._id} company={company} />
      ))}
    </div>
  );
}
