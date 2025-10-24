import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info, Repeat2, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CompanyCard } from "../companies/company-cards";
import { CompanyRow } from "../companies/company-row";
import { VerificationProtectedContent } from "../components/verification-protected-content";

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
    const [verifiedToTheNiche, setVerifiedToTheNiche] = useState(false)

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
                    setVerifiedToTheNiche(profile.verified)
                    
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

    // Filter featured opportunities based on company recommendations AND bookmarked companies
    const filteredOpportunities = featuredOpportunities.filter(opportunity => 
        companyRecommendations.includes(opportunity.company)
    );


    // Other opportunities not in company recommendations, sorted by bookmarked first
    const otherOpportunities = featuredOpportunities
        .filter(opportunity => !filteredOpportunities.includes(opportunity))
        .sort((a, b) => {
            const aBookmarked = bookmarkedCompanies.includes(a.company);
            const bBookmarked = bookmarkedCompanies.includes(b.company);
            if (aBookmarked && !bBookmarked) return -1;
            if (!aBookmarked && bBookmarked) return 1;
            return 0;
        });

    return (
      
        <div >
          <div className="animate-in fade-in-50 duration-700">
            {!isLoading && (
                <div className="flex flex-col items-center gap-8">
                    {/* Welcome Header */}
                    <div className="text-center pt-16 pb-8">
                        <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-black">
                            Welcome, {first_name}
                        </h1>
                        <div className="max-w-8xl mx-auto mb-12">
                            <p className="text-lg text-neutral-600 leading-relaxed font-light text-center mb-6">
                                We have partnered with some of the highest-talent startups so that every connect is fast-tracked to the founder&apos;s inbox. Opportunities recommended to you are tailored to your interests and skillsets, with a higher probability of mutual interest from our partners. 
                            </p>
                            <Alert className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
                                <Repeat2 className="h-5 w-5 text-orange-600" />
                                <AlertDescription>
                                <span className="text-neutral-700">
                                    We are now introducing <strong>Thought Threads</strong>. Once you have received an offer from an opportunity on The Niche, you can thread into the community feed to get opinions on the company, connect with others that have also received an offer and are deliberating, as well as share your experiences! 
                                </span>
                                </AlertDescription>
                            </Alert>
                             <Alert className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
                                <Send className="h-5 w-5 text-orange-600" />
                                <AlertDescription>
                                <span className="text-neutral-700">
                                    We are now introducing <strong>Organic Referrals</strong>. Click share to send the company profile with a customized link tied to your profile to people who you think would be a good fit for the opportunity and refer them to apply!
                                </span>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                    <div className="w-full max-w-6xl mx-auto">
                        {/* Recommended Opportunities Section */}
                        <VerificationProtectedContent 
                          sectionTitle="Opportunities You Should Connect With"
                          fallbackTitle="Verification Required for Opportunity Access"
                          fallbackDescription="Request to join The Niche network to view personalized opportunities and connect with startup founders"
                          className="mb-12"
                          hideWhenNotVerified={true}
                        >
                          {verifiedToTheNiche && (
                            <>
                              {filteredOpportunities.length > 0 && (
                                <div className="mb-12">
                                  <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-2">
                                    {filteredOpportunities.map((company) => (
                                      <CompanyCard key={company._id} company={company} showHighMutualInterest={true} external={false}/>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Show alert if no recommendations */}
                              {filteredOpportunities.length === 0 && (
                                <Alert className="max-w-4xl mx-auto mb-8">
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>
                                    Your recommendations are still generating and will be available in 24 hours. Expand your verified network and bookmark or connect with the below companies that interest you to get more personalized recommendations here.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </>
                          )}
                        </VerificationProtectedContent>

                        {/* Other Opportunities Section */}
                        <VerificationProtectedContent 
                          sectionTitle="Your Bookmarks and Other Opportunities"
                          fallbackTitle="Verification Required for Opportunity Access"
                          className="mb-12"
                          hideWhenNotVerified={true}
                        >
                          {verifiedToTheNiche && otherOpportunities.length > 0 && (
                            <div className="space-y-4">
                              {otherOpportunities.map((company) => (
                                <CompanyRow key={company._id} potential={company.pending_partner} company={company} />
                              ))}
                            </div>
                          )}
                        </VerificationProtectedContent>
                    </div> 
                </div>
            )}
            {isLoading && (
                <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm font-medium text-neutral-700">Loading your opportunities database</p>
                </div>
            )}
            </div> 
        </div>
          
    );
}