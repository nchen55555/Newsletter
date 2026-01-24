"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Info, Loader2, Users } from "lucide-react";
import { CompanyData } from "@/app/types";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle, CardHeader, CardFooter } from "@/components/ui/card";
import Share from "../components/share";
import {type NetworkCompanies} from "@/app/opportunities/opportunities_fetch_information";
import { toast } from "sonner"; 
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  network_connections = undefined,
  onBookmarkChange,
}: {
  appliedToNiche?: boolean;
  company: CompanyWithImageUrl;
  showHighMutualInterest?: boolean;
  potential?: boolean;
  external?: boolean;
  disableNavigation?: boolean;
  isNavigatingExternal?: boolean;
  onNavigateStart?: () => void;
  network_connections?: NetworkCompanies;
  onBookmarkChange?: (companyId: number, isBookmarked: boolean) => void;
}) {
  const router = useRouter();

  const isNavigating = isNavigatingExternal ?? false;

  const title = company.alt || `Company ${company.company?.toString?.() ?? ""}`;

  const handleCardClick = () => {
    if (disableNavigation || !appliedToNiche || isNavigating) {
      if (!appliedToNiche) {
        toast("Create Your Niche Profile to explore opportunities");
      }
      return;
    }
    onNavigateStart?.();
    router.push(`/companies/${company.company}`);
  };

  const warm_intro_available = network_connections?.quality_score && network_connections.quality_score >= 0.5


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
        >
          {company.imageUrl ? (
            <Image
              src={company.imageUrl}
              alt={company.alt || `Logo for ${title}`}
              fill
              className="object-cover"
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
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center gap-2">
            <CardTitle
              className={`text-lg font-semibold ${!disableNavigation ? 'cursor-pointer' : ''}`}
            >
              {title}
            </CardTitle>
            {company.partner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full">
                      <Users className="h-5 w-5 text-neutral-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Partnered with the Niche. Warm Introductions available with sufficient network recommendation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {warm_intro_available ? (
             <div className="flex items-center gap-1 text-[10px] text-neutral-400 border border-neutral-400 rounded px-1.5 py-0.5 cursor-help">
              <span>Sufficient Network Recommendation for a Warm Intro from The Niche</span>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 border border-neutral-400 rounded px-1.5 py-0.5 cursor-help">
                    <span>Insufficient Network Recommendation for a Warm Intro from The Niche</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Intro-able opportunities are identified by not only your network&apos;s interest in the opportunity, but also the quality of your network&apos;s recommendation to you.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {company.caption && (
          <CardDescription className="line-clamp-2">
            {company.caption}
          </CardDescription>
        )}
      </CardHeader>

      {/* Action Buttons */}
      {!disableNavigation && (
        <CardFooter className="flex-col gap-3 pt-0 pb-0">
            <div className="flex w-full justify-between gap-3">
            <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCardClick}
                        className="gap-2"
                        disabled={!appliedToNiche}
                        title={
                          !appliedToNiche
                            ? "Finish onboarding to explore profile"
                            : undefined
                        }
                      >
                          Explore Profile
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!appliedToNiche && (
                      <TooltipContent>
                        Finish onboarding to explore profile
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
            <div className="flex items-center gap-3">
              <RainbowBookmark
                company={company.company}
                onBookmarkChange={onBookmarkChange}
              />
              <Share company={company.company} />
            </div>
          </div>
        </CardFooter>
      )}

      {/* Network Connections - Show even when navigation is disabled */}
      {network_connections?.connectionCount && network_connections.connectionCount > 0 && (
        <CardFooter className="pt-0 pb-4">
          <div className="flex items-center justify-center gap-1 text-xs text-neutral-400 w-full">
            <span>
              {network_connections.connectionCount} {network_connections.connectionCount === 1 ? 'connection' : 'connections'} engaged with this profile recently including {(() => {
                const names = network_connections.connections.map(c => c.name).join(', ')
                return names.length > 30 ? names.substring(0, 30) + '...' : names
              })()}
            </span>
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
