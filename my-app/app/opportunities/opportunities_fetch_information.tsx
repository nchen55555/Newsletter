import * as React from "react"
import { useState, useEffect } from "react"
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import imageUrlBuilder from "@sanity/image-url"
import { client } from "@/lib/sanity/client";
import Image from "next/image"
import Link from "next/link"
import { Info, Repeat2, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VerificationProtectedContent } from "../components/verification-protected-content";
import { CompanyCard } from "../companies/company-cards";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  image?: SanityImageSource;
}

interface OpportunitiesProp{
  featuredOpportunities: CompanyWithImageUrl[]
  posts: Post[]
}

// Image URL builder
const builder = imageUrlBuilder(client);
function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}

export default function Opportunities({ featuredOpportunities, posts }: OpportunitiesProp) {
    const [first_name, setFirstName] = useState("")
    const [profile_image_url, setProfileImage] = useState("")
    const [generated_interest_profile, setGeneratedInterestProfile] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [companyRecommendations, setCompanyRecommendations] = useState<number[]>([])
    const [bookmarkedCompanies, setBookmarkedCompanies] = useState<number[]>([])
    const [verifiedToTheNiche, setVerifiedToTheNiche] = useState(false)
    const [activeTab, setActiveTab] = useState<'recommended' | 'other'>('recommended')
    const [showNewFeaturesDialog, setShowNewFeaturesDialog] = useState(false)

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

    // Show new features dialog when page loads and user is verified
    useEffect(() => {
        if (!isLoading && verifiedToTheNiche) {
            const hasSeenNewFeatures = localStorage.getItem('hasSeenNewFeatures')
            if (!hasSeenNewFeatures) {
                setShowNewFeaturesDialog(true)
            }
        }
    }, [isLoading, verifiedToTheNiche])

    // Recommended: companies in recommendations OR bookmarks
    const recommendedOpportunities = featuredOpportunities.filter(opportunity => 
        companyRecommendations.includes(opportunity.company) || bookmarkedCompanies.includes(opportunity.company)
    );

    // Other opportunities: all remaining companies
    const otherOpportunities = featuredOpportunities.filter(opportunity => 
        !recommendedOpportunities.includes(opportunity)
    );

    const handleCloseNewFeaturesDialog = () => {
        setShowNewFeaturesDialog(false)
        localStorage.setItem('hasSeenNewFeatures', 'true')
    }

    return (
      
        <div >
          {/* New Features Dialog */}
          <Dialog open={showNewFeaturesDialog} onOpenChange={setShowNewFeaturesDialog}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-center mb-4">
                  An Update on The Niche
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <Alert className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
                  <Repeat2 className="h-5 w-5 text-orange-600" />
                  <AlertDescription>
                    <span className="text-neutral-700">
                      We are now introducing <strong>Thought Threads</strong>. Once you have received an offer from an opportunity on The Niche, you can thread into the community feed to get opinions on the company, connect with others that have also received an offer and are deliberating, as well as share your experiences! 
                    </span>
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border border-yellow-200">
                  <Send className="h-5 w-5 text-orange-600" />
                  <AlertDescription>
                    <span className="text-neutral-700">
                      We are now introducing <strong>Organic Referrals</strong>. Click share to send the company profile with a customized link tied to your profile to people who you think would be a good fit for the opportunity and refer them to apply!
                    </span>
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button onClick={handleCloseNewFeaturesDialog} className="px-8">
                  Got it, thanks!
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                                We have partnered with some of the highest-talent startups so that every connect is fast-tracked to the founder&apos;s inbox. 
                            </p>
                            
                            {/* Recent Posts Ticker */}
                            {posts && posts.length > 0 && (
                                <div className="max-w-6xl mx-auto overflow-hidden whitespace-nowrap mb-8 py-4">
                                    <div className="inline-block animate-scroll-x">
                                        {posts.map((post) => (
                                            <Link key={post._id} href={`/articles/${post.slug.current}`} className="inline-flex items-center bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-sm mr-4 hover:shadow-md transition-shadow cursor-pointer">
                                                {post.image ? (
                                                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                                        <Image
                                                            src={urlForImage(post.image).width(24).height(24).fit("crop").url()}
                                                            alt={post.title}
                                                            width={24}
                                                            height={24}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full mr-2 bg-neutral-300"></span>
                                                )}
                                                <span className="text-sm text-neutral-700 font-medium">
                                                    {post.title}
                                                </span>
                                                <span className="text-xs text-neutral-500 ml-2">
                                                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </Link>
                                        ))}
                                        {/* Duplicate for seamless loop */}
                                        {posts.map((post) => (
                                            <Link key={`${post._id}-duplicate`} href={`/articles`} className="inline-flex items-center bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-sm mr-4 hover:shadow-md transition-shadow cursor-pointer">
                                                {post.image ? (
                                                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                                        <Image
                                                            src={urlForImage(post.image).width(24).height(24).fit("crop").url()}
                                                            alt={post.title}
                                                            width={24}
                                                            height={24}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full mr-2 bg-neutral-300"></span>
                                                )}
                                                <span className="text-sm text-neutral-700 font-medium">
                                                    {post.title}
                                                </span>
                                                <span className="text-xs text-neutral-500 ml-2">
                                                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-full max-w-6xl mx-auto">
                        <VerificationProtectedContent 
                          sectionTitle=""
                          fallbackTitle="Verification Required for Opportunity Access"
                          fallbackDescription="Request to join The Niche network to view personalized opportunities and connect with startup founders"
                          className="mb-16"
                          hideWhenNotVerified={true}
                        >
                          {verifiedToTheNiche && (
                            <div className="w-full">
                              {/* Tab Navigation */}
                              <div className="flex border-b border-neutral-200 mb-8">
                                <button
                                  onClick={() => setActiveTab('recommended')}
                                  className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                                    activeTab === 'recommended'
                                      ? 'border-black text-black'
                                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                  }`}
                                >
                                  High Potential Mutual Interest ({recommendedOpportunities.length})
                                </button>
                                <button
                                  onClick={() => setActiveTab('other')}
                                  className={`px-6 py-3 text-base font-medium transition-colors duration-200 border-b-2 ${
                                    activeTab === 'other'
                                      ? 'border-black text-black'
                                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                  }`}
                                >
                                  Other Opportunities on The Niche ({otherOpportunities.length})
                                </button>
                              </div>

                              {/* Tab Content */}
                              <div className="min-h-[600px]">
                                {activeTab === 'recommended' && (
                                  <>
                                    {recommendedOpportunities.length > 0 ? (
                                      <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-2">
                                        {recommendedOpportunities.map((company) => (
                                          <CompanyCard key={company._id} company={company} showHighMutualInterest={true} external={false}/>
                                        ))}
                                      </div>
                                    ) : (
                                      <Alert className="max-w-4xl mx-auto">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                          Your recommendations are still generating and will be available in 24 hours. Expand your verified network and bookmark or connect with companies in &quot;Other Opportunities&quot; to get more personalized recommendations here.
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </>
                                )}

                                {activeTab === 'other' && (
                                  <>
                                    {otherOpportunities.length > 0 ? (
                                      <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-2">
                                        {otherOpportunities.map((company) => (
                                          <CompanyCard key={company._id} company={company} showHighMutualInterest={false} external={false}/>
                                        ))}
                                      </div>
                                    ) : (
                                      <Alert className="max-w-4xl mx-auto">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                          No other opportunities available at this time.
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </VerificationProtectedContent>
                    </div> 
                </div>
            )}
            {isLoading && (
                <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"></div>
                    <p className="text-sm font-medium text-neutral-700">Loading your opportunities database</p>
                </div>
            )}
            </div> 
        </div>
          
    );
}