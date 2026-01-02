import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info } from "lucide-react";
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

interface OpportunitiesProp{
  featuredOpportunities: CompanyWithImageUrl[]
}

export default function Opportunities({ featuredOpportunities }: OpportunitiesProp) {
    const [first_name, setFirstName] = useState("")
    const [profile_image_url, setProfileImage] = useState("")
    const [generated_interest_profile, setGeneratedInterestProfile] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [companyRecommendations, setCompanyRecommendations] = useState<number[]>([])
    const [bookmarkedCompanies, setBookmarkedCompanies] = useState<number[]>([])
    const [hasAcceptedCommitment, setHasAcceptedCommitment] = useState(false)
    const [appliedToNiche, setAppliedToNiche] = useState(false)


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
                    setGeneratedInterestProfile(profile.generated_interest_profile || "")
                    setCompanyRecommendations(profile.company_recommendations || [])
                    setHasAcceptedCommitment(profile.professional_agreement || false);
                    setAppliedToNiche(profile.applied || false);
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            }
        }

        const fetchBookmarks = async () => {
            try {
                const res = await fetch(`/api/get_bookmarks`, {
                    credentials: "include",
                    cache: "no-store",
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setBookmarkedCompanies(data.bookmarks || [])
                }
            } catch (e) {
                console.error("Failed to fetch bookmarks:", e);
            }
        }

        const fetchData = async () => {
            await Promise.all([fetchProfile(), fetchBookmarks()]);
            
            setIsLoading(false);
        }

        fetchData()
    }, [first_name, generated_interest_profile, profile_image_url])

    const handleAcceptCommitment = () => {
      setHasAcceptedCommitment(true);
  };

    // Bookmarked companies
    const bookmarkedOpportunities = featuredOpportunities.filter(opportunity => 
        bookmarkedCompanies.includes(opportunity.company)
    );

    // Recommended: companies in recommendations but NOT bookmarked
    const recommendedOpportunities = featuredOpportunities.filter(opportunity => 
        companyRecommendations.includes(opportunity.company) && !bookmarkedCompanies.includes(opportunity.company)
    );

    // Other opportunities: companies not in recommendations and not bookmarked
    const otherOpportunities = featuredOpportunities.filter(opportunity => 
        !companyRecommendations.includes(opportunity.company) && !bookmarkedCompanies.includes(opportunity.company)
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
                    <div className="text-center pt-16 pb-2">
                        <h1 className="text-4xl md:text-5xl font-semibold mb-4">
                            Welcome, {first_name}
                        </h1>
                        <div className="mb-6">
                            <p className="text-lg text-neutral-600 leading-relaxed font-light text-center mb-6">
                                We have partnered with some of the highest-talent startups so that every connect is fast-tracked to the founder&apos;s inbox.
                            </p>


                        </div>
                    </div>
                        <VerificationProtectedContent
                          sectionTitle=""
                          fallbackTitle="Verification Required for Opportunity Access"
                          fallbackDescription="Request to join The Niche network to view personalized opportunities and connect with startup founders"
                          className="mb-16 w-full"
                        >
                        {hasAcceptedCommitment && (
                            <div className="w-full">
                              {/* All Opportunities Grid */}
                                {featuredOpportunities.length > 0 ? (
                                  <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {recommendedOpportunities.map((company) => (
                                      <CompanyCard
                                        appliedToNiche={appliedToNiche}
                                        key={company._id}
                                        company={company}
                                        showHighMutualInterest={true}
                                        external={false}
                                      />
                                    ))}
                                    {bookmarkedOpportunities.map((company) => (
                                      <CompanyCard
                                        appliedToNiche={appliedToNiche}
                                        key={company._id}
                                        company={company}
                                        showHighMutualInterest={false}
                                        external={false}
                                      />
                                    ))}
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