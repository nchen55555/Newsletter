import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VerificationProtectedContent } from "../components/verification-protected-content";
import { CompanyCard } from "../companies/company-cards";
import { CommitmentPledgeDialog } from "../components/commitment-pledge-dialog";

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
}

export default function Opportunities({ featuredOpportunities }: OpportunitiesProp) {
    const [first_name, setFirstName] = useState("")
    const [profile_image_url, setProfileImage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [hasAcceptedCommitment, setHasAcceptedCommitment] = useState(false)
    const [appliedToNiche, setAppliedToNiche] = useState(false)
    const [networkCompanies, setNetworkCompanies] = useState<Map<number, NetworkCompanies>>(new Map())


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
                    console.log("company map ", companiesMap)
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


    return (
      
        <div >
          {/* Commitment Pledge Dialog - Non-cancellable until accepted */}
          {!isLoading && !hasAcceptedCommitment && (
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
                          fallbackTitle="Verification Required for Opportunity Access"
                          fallbackDescription="Request to join The Niche network to view personalized opportunities and connect with startup founders"
                          className="mb-16 w-full"
                        >
                        {hasAcceptedCommitment && (
                            <div className="w-full">
                              {/* Where Your Network is Looking Section */}
                              {networkCompanies.size > 0 && (
                                <div className="mb-12">
                                  <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-xl font-semibold text-foreground">
                                      Where Your Network is Looking
                                    </h2>
                                  </div>
                                  <div className="mb-4 flex items-start gap-2">
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
                                  </div>
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