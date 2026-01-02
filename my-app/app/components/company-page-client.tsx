"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/app/components/container";
import { CompanyData } from "@/app/types";
import { ExternalLink, UserPlus } from "lucide-react";
import { Navigation } from "@/app/components/header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react';
import ApplyButton from "@/app/components/apply";
import EarlyInterestButton from "@/app/components/early_interest";
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
  onShare?: () => void;
}

export default function CompanyPageClient({ 
  company, 
  companyPost,  
  isDemo = false,
  onIntroRequested,
  onShare
}: CompanyPageClientProps) {
  console.log('CompanyPageClient company data:', company);
  console.log('CompanyPageClient companyPost data:', companyPost);
  
  const [bookmarkedUsers, setBookmarkedUsers] = useState<BookmarkedUser[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);

  const router = useRouter();

  const { isSubscribed } = useSubscriptionContext();

  const components: PortableTextComponents = {
    types: {
      image: ({ value }) => {
        const imageUrl = urlFor(value)?.width(800).url();
        if (!imageUrl) return null;
        return (
          <figure className="my-6">
            <Image
              src={imageUrl}
              alt={value.alt || 'Company image'}
              width={800}
              height={500}
              className="rounded-lg object-cover w-full h-auto"
            />
            {value.caption && (
              <figcaption className="mt-2 text-sm text-neutral-400 italic text-center">
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },
    block: {
      h1: ({ children }) => <h1 className="text-3xl font-semibold mb-4">{children}</h1>,
      h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3">{children}</h2>,
      h3: ({ children }) => <h3 className="text-xl font-medium mb-3">{children}</h3>,
      normal: ({ children }) => <p className="text-neutral-400 leading-relaxed mb-4">{children}</p>,
    },
  };

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
        <div className="mb-5">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Company Logo and Basic Info */}
              
            {/* Company Details */}
            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-neutral-200 mb-4">{title}</h1>
              
              {company.caption && (
                <p className="text-xl text-neutral-400 mb-6">{company.caption}</p>
              )}

              {company.description && (
                <p className="text-neutral-400 leading-relaxed mb-6">{company.description}</p>
              )}

              {company.external_media && (
                  <a
                    href={company.external_media}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Company Website</span>
                  </a>
                )}
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-center justify-center gap-4 py-6 border-b border-neutral-200">
          <RainbowBookmark company={company.company} />
          <Share 
            company={company.company} 
            isDemo={isDemo}
            onShare={onShare}
          />
          {/* <Post 
            company={company.company} 
            companyData={company} 
            isDemo={isDemo}
            onRepost={onRepost}
          /> */}
        </div>

        {company && company.people && (
          <div className="mb-8 border-b">
          <VerificationProtectedContent 
            sectionTitle={`Introductions via The Niche Network`}
            className="mt-12 mb-12"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-200">{company.people}</span>
              {company.partner && !company.pending_partner ? (
                <ApplyButton 
                  company={company.company.toString()} 
                  person={company.people}
                  isDemo={isDemo}
                  onIntroRequested={onIntroRequested}
                />
              ) : company.pending_partner ? (
                <EarlyInterestButton company={company.company.toString()} />
              ) : (
                <span className="text-sm text-neutral-400">Not a partner</span>
              )}
            </div>
            </VerificationProtectedContent>
          </div>
        )}
      <div className="mt-12 mb-12">
      <h2 className="text-2xl font-bold text-neutral-200 mb-6">Our Company Profile</h2>
        {companyPost && companyPost.body && Array.isArray(companyPost.body) && companyPost.body.length > 0 ? (
          <div className="mb-12 border-b">
            {/* <PaywallContent wordLimit={300}> */}
              <section className="prose prose-neutral max-w-none">
                {Array.isArray(companyPost.body) && (
                  <PortableText value={companyPost.body} components={components} />
                )}
              </section>
            {/* </PaywallContent> */}
          </div>
        ) : (
           <Alert className="cursor-pointer hover:bg-gray-50" onClick={() => router.push('/articles')}>
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Company Profile Coming Soon</span>
                </AlertDescription>
              </Alert>
        )}
        </div>

        {/* Refer Someone New Button */}
        {/* People in Network Section */}
        {!isLoadingBookmarks && (
          <VerificationProtectedContent 
            sectionTitle={`People in Your Network Who We Think Would Be A Good Fit Here (${bookmarkedUsers.length})`}
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