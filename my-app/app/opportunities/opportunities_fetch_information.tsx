import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info, FileText, Heart, Users, MousePointer, Handshake } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CompanyCard } from "../companies/company-cards";
import { CompanyRow } from "../companies/company-row";
import { Button } from "@/components/ui/button";
import { VerificationProtectedContent } from "../components/verification-protected-content";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    const [showHowItWorksDialog, setShowHowItWorksDialog] = useState(false)

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
                            
                            {/* How It Works Button */}
                            <div className="text-center mb-12">
                                <Dialog open={showHowItWorksDialog} onOpenChange={setShowHowItWorksDialog}>
                                    <DialogTrigger asChild>
                                        <Button 
                                        type="submit" 
                                        className="h-12 px-8 text-lg text-white"
                                        >
                                            How It Works
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full sm:max-w-4xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-center text-2xl font-semibold mb-4">How It Works</DialogTitle>
                                        </DialogHeader>
                                        <div className="p-6 overflow-x-auto">
                                            {/* Horizontal Process Flow */}
                                            <div className="flex flex-row items-center justify-center gap-4 min-w-fit">
                                                {/* Circular Data Flow */}
                                                <div className="relative w-64 h-68">
                                                    {/* Center - Personalized Recommendations */}
                                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                        <div className="text-center flex flex-col items-center">
                                                            <div className="w-20 h-20 flex items-center justify-center mb-2">
                                                                <p className="text-xs text-neutral-700 font-medium leading-tight">Personalized<br/>Recommendations</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Skills - Top */}
                                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 flex items-center justify-center mb-2">
                                                                <FileText className="w-7 h-7 text-neutral-600" />
                                                            </div>
                                                            <p className="text-xs text-neutral-600 font-medium">Skills</p>
                                                        </div>
                                                    </div>

                                                    {/* Interests - Bottom Left */}
                                                    <div className="absolute bottom-0 left-0">
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 flex items-center justify-center mb-2">
                                                                <Heart className="w-7 h-7 text-neutral-600" />
                                                            </div>
                                                            <p className="text-xs text-neutral-600 font-medium">Interests</p>
                                                        </div>
                                                    </div>

                                                    {/* Networks - Bottom Right */}
                                                    <div className="absolute bottom-0 right-0">
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 flex items-center justify-center mb-2">
                                                                <Users className="w-7 h-7 text-neutral-600" />
                                                            </div>
                                                            <p className="text-xs text-neutral-600 font-medium">Networks</p>
                                                        </div>
                                                    </div>

                                                    {/* Small arrows pointing to center */}
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
                                                        <defs>
                                                            <marker id="small-arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                                                <polygon points="0 0, 6 2, 0 4" fill="#a3a3a3" />
                                                            </marker>
                                                        </defs>
                                                        
                                                        {/* Small arrow from Skills */}
                                                        <line
                                                            x1="128" y1="80"
                                                            x2="128" y2="95"
                                                            stroke="#a3a3a3"
                                                            strokeWidth="1"
                                                            markerEnd="url(#small-arrow)"
                                                        />
                                                        
                                                        {/* Small arrow from Networks */}
                                                        <line
                                                            x1="170" y1="180"
                                                            x2="155" y2="155"
                                                            stroke="#a3a3a3"
                                                            strokeWidth="1"
                                                            markerEnd="url(#small-arrow)"
                                                        />
                                                        
                                                        {/* Small arrow from Interests */}
                                                        <line
                                                            x1="86" y1="180"
                                                            x2="101" y2="155"
                                                            stroke="#a3a3a3"
                                                            strokeWidth="1"
                                                            markerEnd="url(#small-arrow)"
                                                        />
                                                    </svg>
                                                </div>

                                                {/* Arrow 1 - from edge of circular diagram to You Connect */}
                                                <div className="flex items-center">
                                                    <svg className="w-12 h-6" viewBox="0 0 48 24">
                                                        <path d="M 4 12 L 40 12" stroke="#a3a3a3" strokeWidth="2" markerEnd="url(#arrow-flow)" />
                                                        <defs>
                                                            <marker id="arrow-flow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                                                <polygon points="0 0, 8 3, 0 6" fill="#a3a3a3" />
                                                            </marker>
                                                        </defs>
                                                    </svg>
                                                </div>

                                                {/* Connect */}
                                                <div className="text-center">
                                                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                                                        <MousePointer className="w-8 h-8 text-neutral-600" />
                                                    </div>
                                                    <p className="text-sm text-neutral-700 font-medium">You<br/>Connect</p>
                                                </div>

                                               {/* Arrow 2 - from You Connect to Direct Founder Connection */}
                                                <div className="flex items-center">
                                                    <svg className="w-12 h-6" viewBox="0 0 48 24">
                                                        <path d="M 4 12 L 40 12" stroke="#a3a3a3" strokeWidth="2" markerEnd="url(#arrow-flow)" />
                                                        <defs>
                                                            <marker id="arrow-flow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                                                <polygon points="0 0, 8 3, 0 6" fill="#a3a3a3" />
                                                            </marker>
                                                        </defs>
                                                    </svg>
                                                </div>

                                                {/* Founder Connection */}
                                                <div className="text-center">
                                                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                                                        <Handshake className="w-8 h-8 text-neutral-600" />
                                                    </div>
                                                    <p className="text-sm text-neutral-700 font-medium">Founder <br />Introduction</p>
                                                </div>
                                            </div>
                                            
                                            {/* Explanation Text */}
                                            <div className="mt-8 text-center max-w-4xl mx-auto">
                                                <p className="text-base text-neutral-700 leading-relaxed">
                                                    Your interests, skills, and verified professional network feeds our algorithm to create personalized recommendations. That is why the more you tell us about yourself the better we are able to match you with the best opportunities. <strong> You request an intro to our partners by clicking on the company and connecting on the opportunities tab. Our platform fast-tracks you directly to the founder&apos;s inbox, so that if there is mutual interest, you meet directly with the founders.</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            
                            
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