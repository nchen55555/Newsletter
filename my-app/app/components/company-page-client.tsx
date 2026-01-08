"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Container } from "@/app/components/container";
import { CompanyData } from "@/app/types";
import { Globe } from "lucide-react";
import { Navigation } from "@/app/components/header";
import { type PortableTextComponents, type PortableTextBlock } from '@portabletext/react';
import ApplyButton from "@/app/components/apply";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import Share from "@/app/components/share";
import { client } from "@/lib/sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { VerificationProtectedContent } from "@/app/components/verification-protected-content";
import { NetworkConnectionsGrid } from "@/app/components/network-connections-grid";
import { ProfileData } from "@/app/types";
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { useSubscriptionContext } from "@/app/components/subscription_context";
import { Button } from "@/components/ui/button"

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;


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
              <span className="hidden sm:inline">Read Our Article</span>
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
            <ApplyButton
              company_title={title}
              company={company.company.toString()}
              person={company.people}
              isDemo={isDemo}
              onIntroRequested={onIntroRequested}
              hiringTags={company.hiring_tags}
            />
        </div>

        {!isLoadingBookmarks && (
          <VerificationProtectedContent 
            sectionTitle={`${title} is Trending in Your Network`}
            className="mt-12 mb-12"
          >            
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
              isExternalView={true}
            />
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