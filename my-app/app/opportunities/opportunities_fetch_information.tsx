import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import CompanyCards from "../companies/company-cards";


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

    const filteredBookmarkedOpportunities = featuredOpportunities.filter(opportunity => 
        bookmarkedCompanies.includes(opportunity.company)
    );

    // Other opportunities not in company recommendations or bookmarks (regular partners only)
    const otherOpportunities = featuredOpportunities.filter(opportunity => 
        !companyRecommendations.includes(opportunity.company) && 
        !bookmarkedCompanies.includes(opportunity.company) && 
        opportunity.partner && 
        !opportunity.pending_partner && 
        !bookmarkedCompanies
    );

    // Potential partner opportunities (coming soon)
    const pendingPartnerOpportunities = featuredOpportunities.filter(opportunity => 
        opportunity.pending_partner && 
        !bookmarkedCompanies
    );

    const externalOpportunities = featuredOpportunities.filter(opportunity => 
        !opportunity.partner && 
        !bookmarkedCompanies
    );

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
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-light max-w-5xl mx-auto mb-8">
                            <strong>Bookmark</strong> companies that strongly interest you to follow their progress and so we can surface similar opportunities for you in the future. <strong>Connect</strong> to companies that are directly partnered with The Niche to apply and get immediately fast-tracked to the founder&apos;s inbox pending mutual interest. 
                        </p>
                    </div>
                    {verifiedToTheNiche && (<CompanyCards priority={filteredOpportunities} bookmarks={filteredBookmarkedOpportunities} other={otherOpportunities} external={externalOpportunities} pendingPartner={pendingPartnerOpportunities}/> )}
                    {!verifiedToTheNiche && (<Alert className="max-w-2xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Create your profile and wait for it to get verified to access
                </AlertDescription>
              </Alert>)} 
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