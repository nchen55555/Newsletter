"use client";

import { useState, useEffect } from "react";
import { Container } from "@/app/components/container";
import { CompanyData } from "@/app/types";
import { Globe, Users } from "lucide-react";
import { Navigation } from "@/app/components/header";
import { type PortableTextBlock } from '@portabletext/react';
import ApplyButton from "@/app/components/apply";
import EarlyInterestButton from "@/app/components/early_interest";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import Share from "@/app/components/share";
import { VerificationProtectedContent } from "@/app/components/verification-protected-content";
import { NetworkConnectionsGrid } from "@/app/components/network-connections-grid";
import { ProfileData } from "@/app/types";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { useSubscriptionContext } from "@/app/components/subscription_context";
import { Button } from "@/components/ui/button"


type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

interface BookmarkedUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  linkedin_url?: string;
  bio?: string;
}

interface CompanyPageClientProps {
  company: CompanyWithImageUrl;
  companyPost?: { body?: PortableTextBlock[] } | null;
  isDemo?: boolean;
  onIntroRequested?: () => void;
}

export default function CompanyPageClient({ 
  company, 
  companyPost,  
  isDemo = false,
  onIntroRequested,
}: CompanyPageClientProps) {
  
  const [bookmarkedUsers, setBookmarkedUsers] = useState<BookmarkedUser[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);

  const hasPost = !!companyPost

  const { isSubscribed } = useSubscriptionContext();


  useEffect(() => {
    const fetchBookmarkedUsers = async () => {
      try {
        const bookmarksResponse = await fetch(`/api/companies/${company.company}/bookmarked-users`, {
          credentials: 'include'
        });
        
        if (bookmarksResponse.ok) {
          const users = await bookmarksResponse.json();
          setBookmarkedUsers(users);
        }
      } catch (err) {
        console.error('Error fetching bookmarked users:', err);
      } finally {
        setIsLoadingBookmarks(false);
      }
    };

    fetchBookmarkedUsers();
  }, [company.company]);



  const title = company.alt || company.caption || `Company ${company.company}`;

  const companyContent = (
    <Container>
      <div className="pt-10 pb-5">
        {/* Company Header */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Company Logo and Basic Info */}
              
            {/* Company Details */}
            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-neutral-200 mb-4">{title}</h1>
              
              {company.caption && (
                <p className="text-xl text-neutral-400 mb-6">{company.caption}</p>
              )}

              {company.description && (
                <p className="text-neutral-400 leading-relaxed">{company.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex gap-4 py-4 border-b border-neutral-200">
            {hasPost && (<Button
              variant="outline"
              size="lg"
              onClick={() => window.open(`/articles/${company.company}`, '_blank')}
              className="gap-2"
            >
              <span className="hidden sm:inline">Read Our Interview</span>
            </Button>
            )}
            <RainbowBookmark company={company.company} />
            <Share company={company.company} />
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open(company.external_media, '_blank')}
              className="gap-2"
            >
              <Globe></Globe>
            </Button>
            {company.partner ? (
            <ApplyButton
              company_title={title}
              company={company.company.toString()}
              person={company.people}
              isDemo={isDemo}
              onIntroRequested={onIntroRequested}
              hiringTags={company.hiring_tags}
            />
            ) : (
              <EarlyInterestButton company={company.company.toString()} company_title={title} />
            )}
        </div>

        {!isLoadingBookmarks && (
          <VerificationProtectedContent 
            sectionTitle={`Who Else In Your Network is Looking at ${title}?`}
            className="mt-12 mb-12"
          >
            {bookmarkedUsers.length === 0 ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 h-48 flex flex-col items-center justify-center text-center space-y-2">
                  <Users className="w-8 h-8 text-gray-400" />
                  <div className="text-sm font-medium text-gray-600">
                    No one from your network has engaged with this company yet
                  </div>
                  <div className="text-xs text-gray-500 max-w-xs">
                    As more people in your trusted network bookmark {title}, they&apos;ll appear here.
                  </div>
                </div>
              </div>
            ) : (
              <NetworkConnectionsGrid
                connections={bookmarkedUsers.map((user) => ({
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  profile_image_url: user.profile_image_url || '',
                  bio: user.bio || '',
                  email: '',
                  linkedin_url: user.linkedin_url || '',
                  resume_url: '',
                  personal_website: '',
                  phone_number: '',
                  access_token: '',
                  school: ''
                } as ProfileData))}
                showSeeAll={true}
                onSeeAllConnections={() => {}}
                maxDisplay={bookmarkedUsers.length}
                appliedToTheNiche={true}
                isExternalView={false}
              />
            )}
          </VerificationProtectedContent>
        )}      
      </div>
    </Container>
  )

  if (isSubscribed) {
    return (
      <SidebarLayout title="Opportunities">
        {companyContent}
      </SidebarLayout>
    )
  }
  else {
    return (
      <>
      <Navigation/>
      {companyContent}
      </>
    )
  }
}