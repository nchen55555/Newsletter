import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProfileAvatar from "../components/profile_avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CompanyCards from "../companies/company-cards";


export interface CompanyData extends SanityDocument {
  company: number
  image?: SanityImageSource
  publishedAt: string
  alt?: string
  caption?: string
  description?: string
  tags?: string[]
  location?: string
  employees?: string
  founded?: string
  stage?: string
  industry?: string
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
    const [appliedToTheNiche, setAppliedToTheNiche] = useState(false)

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
                    setAppliedToTheNiche(profile.applied)
                    
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [first_name, generated_interest_profile, profile_image_url])

    // Filter featured opportunities based on company recommendations
    const filteredOpportunities = featuredOpportunities.filter(opportunity => 
        companyRecommendations.includes(opportunity.company) && opportunity.partner
    );

    // Other opportunities not in company recommendations
    const otherOpportunities = featuredOpportunities.filter(opportunity => 
        !companyRecommendations.includes(opportunity.company) && opportunity.partner
    );

    const externalOpportunities = featuredOpportunities.filter(opportunity => 
        !opportunity.partner
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
                            As you use this platform more and more, we will be able to surface better and better opportunities aligned to your interests. We partner with a select cohort of startups to surface top-level talent such that you can directly meet with the founders for a conversation if there is mutual interest. 
                        </p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    Insights About Your Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-8">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-xl mb-3">Insights About Your Profile</DialogTitle>
                                    <DialogDescription className="text-base leading-relaxed">
                                        Based on your interests, your experiences and core competencies, here are our consolidated conclusions about your strengths and what you might be interested in.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="bg-neutral-50 rounded-lg p-6">
                                    <div className="flex gap-6 items-start mb-6">
                                        {/* Profile Image */}
                                        <div className="flex-shrink-0">
                                            <ProfileAvatar
                                                name={first_name || 'User'}
                                                imageUrl={profile_image_url || undefined}
                                                size={64}
                                                editable={false}
                                                className="w-16 h-16 rounded-full shadow-lg border-2 border-white"
                                            />
                                        </div>
                                        
                                        {/* About Section */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                                About {first_name}
                                            </h3>
                                            {/* <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                                On The Niche
                                            </span> */}
                                        </div>
                                    </div>
                                    
                                    {generated_interest_profile && (<div className="text-base leading-relaxed text-neutral-700 whitespace-pre-line">
                                        {generated_interest_profile.replace(/•\s+/g, '• ')}
                                    </div>)}
                                    {!generated_interest_profile && (<Alert className="max-w-2xl mx-auto">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                    Your recommendations may still be generating - check back 2-3 days after you submitted your profile.
                                    </AlertDescription>
                                </Alert>)}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {appliedToTheNiche && (<CompanyCards priority={filteredOpportunities} other={otherOpportunities} external={externalOpportunities}/> )}
                    {!appliedToTheNiche && (<Alert className="max-w-2xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Create Your Profile and Wait for It To Get Verified To Access
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