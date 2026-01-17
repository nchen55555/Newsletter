import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VerificationProtectedContent } from "../components/verification-protected-content";
import { CompanyCard } from "../companies/company-cards";
import { CommitmentPledgeDialog } from "../components/commitment-pledge-dialog";
import { InformationDialog } from "../components/information-dialog";
import CompanyCarousel from "../components/company_carousel";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

export interface CompanyData extends SanityDocument {
  company: number
  image?: SanityImageSource
  publishedAt: string
  alt?: string
  caption?: string
  description?: string
  tags?: string[]
  hiring_tags?: string[]
  location?: string
  employees?: string
  founded?: string
  stage?: string
  industry?: string
  partner?: boolean
  pending_partner?: boolean
}
  

type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

export type NetworkCompanies = {
  connectionCount: number;
  connections: Array<{ id: number; name: string }>;
  weight: number;
  quality_score: number;
};

interface OpportunitiesProp{
  featuredOpportunities: CompanyWithImageUrl[]
  showIntro?: boolean
}

export default function Opportunities({ featuredOpportunities, showIntro = false }: OpportunitiesProp) {
    const [first_name, setFirstName] = useState("")
    const [profile_image_url, setProfileImage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [hasAcceptedCommitment, setHasAcceptedCommitment] = useState(false)
    const [appliedToNiche, setAppliedToNiche] = useState(false)
    const [networkCompanies, setNetworkCompanies] = useState<Map<number, NetworkCompanies>>(new Map())
    const [showIntroDialog, setShowIntroDialog] = useState(showIntro)
    const [bookmarkedCompanies, setBookmarkedCompanies] = useState<number[]>([])

    const router = useRouter();


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/get_profile`, {
                    credentials: "include",
                    cache: "no-store",
                });
                
                if (res.ok) {
                  const profile = await res.json();
                  setFirstName(profile.first_name || "")
                  setProfileImage(profile.profile_image_url || "")
                  setHasAcceptedCommitment(profile.professional_agreement || false);
                  setAppliedToNiche(profile.applied || false);
                  setBookmarkedCompanies(profile.bookmarked_companies || [])
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            }
        }

        const fetchNetworkCompanies = async () => {
            try {
                const res = await fetch(`/api/get_network_companies`, {
                    credentials: "include",
                    cache: "no-store",
                });

                if (res.ok) {
                    const data = await res.json();
                    const companiesMap = new Map(Object.entries(data.companies).map(([key, value]) => [Number(key), value as NetworkCompanies]))
                    setNetworkCompanies(companiesMap)
                }
            } catch (e) {
                console.error("Failed to fetch network companies:", e);
            }
        }

        const fetchData = async () => {
            await Promise.all([fetchProfile(), fetchNetworkCompanies()]);

            setIsLoading(false);
        }

        fetchData()
    }, [first_name, profile_image_url])

    const handleAcceptCommitment = () => {
      setHasAcceptedCommitment(true);
  };

    // Other opportunities: companies not in network companies and not bookmarked
    const otherOpportunities = featuredOpportunities.filter(opportunity =>
        !networkCompanies.has(opportunity.company)
    );

    // if (showOnboarding) {
    //   return (
    //     <div className="animate-in fade-in-50 duration-700 text-center items-center justify-center">
    //           {!isLoading && (
    //             <div className="flex flex-col gap-4 w-full">
    //                     <VerificationProtectedContent
    //                       sectionTitle=""
    //                       fallbackTitle="Build Your Network to Access Opportunities"
    //                       fallbackDescription="Request to join The Niche network to view personalized opportunities and connect with startup founders"
    //                       className="mb-16 w-full"
    //                     >
    //                     {bookmarkedCompanies.length > 0 && (
    //                         <div className="w-full text-center">
    //                           {/* Sequential Typewriter for all onboarding content */}
    //                           {networkCompanies.size > 0 && (
    //                             <div className="mb-12">
    //                               <SequentialTypewriter
    //                                 sections={onboardingSections}
    //                               />
    //                             </div>
    //                           )}
    //                           </div>
    //                       )}
    //                     </VerificationProtectedContent>
    //                 </div>
    //         )}
    //         {isLoading && (
    //           <div className="flex flex-col items-center justify-center min-h-screen">
    //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
    //             <p className="text-sm font-medium text-neutral-400">Loading your opportunities database</p>
    //           </div>
    //         )}
    //         </div>
    //   )
    // }

    return (
      
        <div >
          {/* Intro dialog when coming from onboarding */}
          {(showIntroDialog  || bookmarkedCompanies.length === 0) && featuredOpportunities.length > 0 && (
            <InformationDialog
              open={showIntroDialog}
              onOpenChange={() => setShowIntroDialog(true)}
              title=""
              description=""
              allowClose={false}
            > 
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  {/* Left: copy, 1/3 width */}
                  <div className="w-full md:w-1/3 flex items-start justify-center">
                    <div>
                      <h1 className="text-2xl font-semibold text-foreground text-center mb-4">
                        Opportunities Your Network is Already Looking At
                      </h1>
                      <p className="text-base text-neutral-400 max-w-xs text-center">
                        Shared interest among your professional circle is a strong predictor of fit.{" "}
                        <b>See what opportunities your network is exploring, and bookmark the ones that catch your eye.</b>
                        <br />
                        <br />
                        The Niche has partnered with select opportunities where the context behind your network unlocks warm introductions direct to the founders. 
                      </p>
                    </div>
                  </div>
                  {/* Right: carousel, 2/3 width */}
                  <div className="w-full md:w-2/3 flex justify-center">
                    <CompanyCarousel
                      companies={
                        networkCompanies.size > 0
                          ? featuredOpportunities.filter(company => networkCompanies.has(company.company))
                          : featuredOpportunities
                      }
                      network_connections={networkCompanies.size > 0 ? networkCompanies : undefined}
                      onBookmarksChange={(bookmarks) => setBookmarkedCompanies(bookmarks)}
                    />
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                      <Button
                        type="button"
                        onClick={() => { setShowIntroDialog(false); router.push("/opportunities") }}
                        disabled={bookmarkedCompanies.length < 1}
                        className="px-6 py-2 text-sm bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50"
                        title={bookmarkedCompanies.length < 1 ? "Bookmark at least one company to finish perusing" : undefined}
                      >
                        Finish Perusing
                      </Button>
                      </span>
                    </TooltipTrigger>
                    {bookmarkedCompanies.length < 1 && (
                      <TooltipContent>
                        Bookmark at least one company to finish perusing
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                
                </div>
              </div>
            </InformationDialog>

          )}

          {/* Commitment Pledge Dialog - Non-cancellable until accepted */}
          {!((showIntroDialog  || bookmarkedCompanies.length === 0) && featuredOpportunities.length > 0) && !isLoading && !hasAcceptedCommitment && (
            <CommitmentPledgeDialog
              open={true}
              onAccept={handleAcceptCommitment}
            />
          )}


          {/* Main opportunities layout (header + gated content) */}
            <div className="animate-in fade-in-50 duration-700">
              {!isLoading && (
                <div className="flex flex-col gap-4 w-full">
                    {/* Welcome Header */}
                    <div className="pt-16 pb-2">
                        <h1 className="text-4xl md:text-5xl font-semibold mb-4">
                            Welcome, {first_name}
                        </h1>
                    </div>
                        <VerificationProtectedContent
                          sectionTitle=""
                          fallbackTitle="Build Your Network to Access Opportunities"
                          fallbackDescription="Request to join The Niche network to view personalized opportunities and connect with startup founders"
                          className="mb-16 w-full"
                        >
                        {hasAcceptedCommitment && (
                            <div className="w-full">
                              {/* Where Your Network is Looking Section */}
                              {networkCompanies.size > 0 && (
                                <div className="mb-12">
                                  <div className="flex items-center gap-2 mb-6">
                                    <h2 className="text-xl font-semibold text-foreground">
                                      Where Your Network is Looking
                                    </h2>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            className="text-neutral-400 hover:text-neutral-200 inline-flex items-center justify-center"
                                            aria-label="Why your network section matters"
                                          >
                                            <Info className="w-4 h-4" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm text-xs leading-relaxed space-y-2 text-black">
                                          <p className="font-semibold">
                                            Why it matters
                                          </p>
                                          <p>
                                            See which opportunities your trusted network is focusing their attention on. Shared interest amongst your closest professional circles is a strong predictor of fit. 
                                          </p>
                                          <p className="font-semibold">
                                            The Niche has partnered with select opportunities where your network&apos;s convergence unlocks direct warm introductions to founders and heads of talent to expedite your interest directly to their inbox.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  {/* <div className="mb-4 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-semibold text-neutral-200">Why it matters</p>
                                    </div>
                                  </div>
                                  <div className="text-sm text-neutral-400 mb-6">
                                    See which opportunities your trusted network is focusing their attention on. Shared interest amongst your closest professional circles is a strong predictor of fit. Companies know their best hires come validated by contextualized networks, not cold applications. 
                                  </div>
                                    <div className="text-sm text-neutral-200 mb-6">
                                    <b>The Niche has partnered with select opportunities where your network&apos;s convergence unlocks direct warm introductions to founders and heads of talent to expedite your interest directly to their inbox. </b>
                                  </div> */}
                                  <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {featuredOpportunities
                                      .filter(company => networkCompanies.has(company.company))
                                      .sort((a, b) => {
                                        const weightA = networkCompanies.get(a.company)?.weight || 0
                                        const weightB = networkCompanies.get(b.company)?.weight || 0
                                        return weightB - weightA // Sort descending (highest weight first)
                                      })
                                      .map((company) => (
                                        <CompanyCard
                                          appliedToNiche={appliedToNiche}
                                          key={company._id}
                                          company={company}
                                          showHighMutualInterest={false}
                                          external={false}
                                          network_connections={networkCompanies.get(company.company)}
                                        />
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Other Opportunities Section */}
                              <div className="mb-12">
                                <h2 className="text-xl font-semibold mb-6 text-foreground">
                                  Other
                                </h2>
                              {/* All Opportunities Grid */}
                                {featuredOpportunities.length > 0 ? (
                                  <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {otherOpportunities.map((company) => (
                                      <CompanyCard
                                        appliedToNiche={appliedToNiche}
                                        key={company._id}
                                        company={company}
                                        showHighMutualInterest={false}
                                        external={false}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                      Your recommendations are still generating. Expand your verified network and bookmark companies to get personalized recommendations.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                              </div>
                          )}
                        </VerificationProtectedContent>
                    </div> 
            )}
            {isLoading && (
              <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mb-4"></div>
                <p className="text-sm font-medium text-neutral-400">Loading your opportunities database</p>
              </div>
            )}
            </div>
        </div>
          
    );
}