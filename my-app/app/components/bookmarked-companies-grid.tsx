"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { CompanyWithImageUrl } from "@/app/types";
import { CompanyCard } from "@/app/companies/company-cards";
import { Skeleton } from "@/components/ui/skeleton";

interface BookmarkedCompaniesGridProps {
  companies: CompanyWithImageUrl[];
  className?: string;
  onSeeAllCompanies?: () => void;
  showSeeAll?: boolean;
  maxDisplay?: number; // Maximum number of companies to display before showing "See All"
  appliedToTheNiche?: boolean;
  isExternalView?: boolean;
  loading?: boolean;
}

export function BookmarkedCompaniesGrid({
  companies,
  className = "",
  onSeeAllCompanies,
  showSeeAll = false,
  maxDisplay = 5,
  appliedToTheNiche = false,
  isExternalView = false,
  loading = false
}: BookmarkedCompaniesGridProps) {
  const [navigatingCompanyId, setNavigatingCompanyId] = useState<number | null>(null);

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-6 rounded-lg p-4">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // If no companies and no see all, show empty state
  if ((!companies || companies.length === 0) && !showSeeAll) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No bookmarked companies yet.
      </div>
    );
  }

  // Limit displayed companies
  const displayedCompanies = companies.slice(0, maxDisplay);

  return (
    <div className="space-y-6 rounded-lg p-4">
      {!isExternalView && (
        <div className="text-sm text-neutral-400">
          Companies you&apos;ve bookmarked and are interested in exploring opportunities with.
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {/* Existing companies */}
        {displayedCompanies.map((company) => (
          <CompanyCard
            key={company._id}
            company={company}
            appliedToNiche={appliedToTheNiche}
            showHighMutualInterest={false}
            external={false}
            disableNavigation={isExternalView}
            isNavigatingExternal={navigatingCompanyId === company.company}
            onNavigateStart={() => setNavigatingCompanyId(company.company)}
          />
        ))}          
        {/* See All Companies card */}
        {showSeeAll && onSeeAllCompanies && (() => {
          // External view logic
          if (isExternalView) {
            if (companies.length === 0) {
              // Show "User Has No Bookmarked Companies Yet"
              return (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 aspect-[4/3] flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <Building2 className="w-8 h-8 text-gray-400" />
                    <div className="text-sm font-medium text-gray-600">
                      User Has No Bookmarked Companies Yet
                    </div>
                  </div>
                </div>
              );
            } else if (companies.length > maxDisplay) {
              // Return empty div
              return <div />;
            } else {
              // companies.length <= maxDisplay && companies.length > 0: don't show card at all
              return null;
            }
          }

          // Non-external view (original logic)
          return (
            <div
              onClick={onSeeAllCompanies}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col items-center justify-center"
            >
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <Building2 className="w-8 h-8 text-gray-400" />
                <div className="text-sm font-medium text-gray-600">See All Companies</div>
                <div className="text-xs text-gray-500">
                  {!appliedToTheNiche ? 'Activate Your Profile to Start Viewing Opportunities' : ''}
                  {companies.length > maxDisplay ?
                    `View all ${companies.length} companies` :
                    'Start Viewing Opportunities'
                  }
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}