"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { CompanyData } from "@/app/types";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle, CardHeader, CardFooter } from "@/components/ui/card";
import Share from "../components/share";

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

interface CompanyCardsProps {
  priority: CompanyWithImageUrl[];
  bookmarks: CompanyWithImageUrl[];
  other: CompanyWithImageUrl[];
  external?: CompanyWithImageUrl[];
  pendingPartner?: CompanyWithImageUrl[];
}


export function CompanyCard({
  appliedToNiche = true,
  company,
  showHighMutualInterest = false,
  disableNavigation = false,
  isNavigatingExternal,
  onNavigateStart,
}: {
  appliedToNiche?: boolean;
  company: CompanyWithImageUrl;
  showHighMutualInterest?: boolean;
  potential?: boolean;
  external?: boolean;
  disableNavigation?: boolean;
  isNavigatingExternal?: boolean;
  onNavigateStart?: () => void;
}) {
  const router = useRouter();

  const isNavigating = isNavigatingExternal ?? false;

  const title = company.alt || `Company ${company.company?.toString?.() ?? ""}`;

  const handleCardClick = () => {
    console.log("handleCardClick", disableNavigation, appliedToNiche, isNavigating);
    if (disableNavigation || !appliedToNiche || isNavigating) return;
    onNavigateStart?.();
    router.push(`/companies/${company.company}`);
  };

  return (
    <Card className="group relative overflow-hidden pt-0 transition-all duration-200 hover:shadow-lg">
      {/* Badge */}
      {showHighMutualInterest && company.partner && (
        <div className="absolute right-3 top-3 inline-flex items-center rounded-full bg-gradient-to-r from-green-50 via-yellow-50 to-green-50 px-3 py-2 text-xs font-medium text-neutral-600 z-10 border border-neutral-200">
          High Potential Mutual Interest
        </div>
      )}

      {/* Image Section */}
      <CardContent className="px-0 pb-0 pt-0">
        <div
          className={`relative aspect-[5/3] bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden rounded-t-xl ${
            !disableNavigation ? 'cursor-pointer' : ''
          }`}
          onClick={handleCardClick}
        >
          {company.imageUrl ? (
            <Image
              src={company.imageUrl}
              alt={company.alt || `Logo for ${title}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-6xl font-bold text-neutral-300">
                {title?.charAt(0)?.toUpperCase?.() || "C"}
              </div>
            </div>
          )}

          {isNavigating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-700" />
            </div>
          )}
        </div>
      </CardContent>

      {/* Title and Caption */}
      <CardHeader className="text-center">
        <CardTitle
          className={`text-lg font-semibold ${!disableNavigation ? 'cursor-pointer' : ''}`}
          onClick={handleCardClick}
        >
          {title}
        </CardTitle>
        {company.caption && (
          <CardDescription className="line-clamp-2">
            {company.caption}
          </CardDescription>
        )}
      </CardHeader>

      {/* Action Buttons */}
      {!disableNavigation && (
        <CardFooter className="gap-3 justify-between pt-0">
          <Button
            onClick={handleCardClick}
            className="text-neutral-900 bg-neutral-100 hover:bg-neutral-200"
            disabled={isNavigating}
          >
            Explore Profile
          </Button>
          <div className="flex items-center gap-1">
            <RainbowBookmark company={company.company} />
            <Share company={company.company} />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default function CompanyCards({ priority, bookmarks, other = [] }: CompanyCardsProps) {
  const [navigatingCompanyId, setNavigatingCompanyId] = useState<number | null>(null);

  return (
    <div className="w-full">      
      {/* Tab Content */}
      {priority.length === 0 || bookmarks.length === 0 ? (
              <Alert className="max-w-2xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your recommendations are still generating. Expand your verified network and bookmark/connect with companies that interest you to get more personalized recommendations here.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-4">
                {priority.map((company) => (
                  <CompanyCard
                    key={company._id}
                    company={company}
                    showHighMutualInterest={true}
                    external={false}
                    isNavigatingExternal={navigatingCompanyId === company.company}
                    onNavigateStart={() => setNavigatingCompanyId(company.company)}
                  />
                ))}
                {bookmarks.map((company) => (
                  <CompanyCard
                    key={company._id}
                    company={company}
                    showHighMutualInterest={false}
                    external={false}
                    isNavigatingExternal={navigatingCompanyId === company.company}
                    onNavigateStart={() => setNavigatingCompanyId(company.company)}
                  />
                ))}
              </div>
            )}

        {other.map((company) => (
                <CompanyCard
                  key={company._id}
                  company={company}
                  external={false}
                  isNavigatingExternal={navigatingCompanyId === company.company}
                  onNavigateStart={() => setNavigatingCompanyId(company.company)}
                />
              ))}
      </div>
  );
}
