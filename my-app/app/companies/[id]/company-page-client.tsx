"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/app/components/container";
import { CompanyData } from "@/app/types";
import { ExternalLink, MapPin, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react';
import ApplyButton from "@/app/components/apply";
import EarlyInterestButton from "@/app/components/early_interest";
import RainbowBookmark from "@/app/components/rainbow_bookmark";
import ProfileCard from "@/app/components/profile_card";
import { client } from "@/lib/sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { encodeSimple } from "@/app/utils/simple-hash";

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
  companyPost: { body?: PortableTextBlock[] } | null;
}

export default function CompanyPageClient({ 
  company, 
  companyPost
}: CompanyPageClientProps) {
  const [bookmarkedUsers, setBookmarkedUsers] = useState<BookmarkedUser[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);

  const router = useRouter();

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
              <figcaption className="mt-2 text-sm text-neutral-500 italic text-center">
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
      normal: ({ children }) => <p className="text-neutral-700 leading-relaxed mb-4">{children}</p>,
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


  return (
    <Container>
      <div className="pt-10 pb-16">
        {/* Company Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Company Logo and Basic Info */}
            <div className="flex-shrink-0">
              <div className="grid h-32 w-40 place-items-center overflow-hidden rounded-xl bg-neutral-100 mb-6">
                {company.imageUrl ? (
                  <Image
                    src={company.imageUrl}
                    alt={title}
                    width={160}
                    height={128}
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <div className="text-2xl font-semibold text-neutral-600">
                    {title?.charAt(0)?.toUpperCase?.() || "C"}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <RainbowBookmark company={company.company} />
                {/* Company Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.location && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin className="h-4 w-4" />
                    <span>{company.location}</span>
                  </div>
                  
                )}
              </div>

              {/* Tags */}
              <div className="space-y-4">
                {company.hiring_tags && company.hiring_tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                      {company.hiring_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-700 border border-yellow-200 w-fit"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}

                {/* Partnership Status */}
                {/* <div>
                  {company.partner && !company.pending_partner && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 border border-green-200">
                      A Niche Partner
                    </span>
                  )}
                  
                  {company.pending_partner && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 border border-green-200">
                      Partnership Coming Soon
                    </span>
                  )}
                  
                  {!company.partner && !company.pending_partner && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 border border-red-200">
                      Not A Partner Yet
                    </span>
                  )}
                </div> */}
              </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-neutral-900 mb-4">{title}</h1>
              
              {company.caption && (
                <p className="text-xl text-neutral-600 mb-6">{company.caption}</p>
              )}

              {company.description && (
                <p className="text-neutral-700 leading-relaxed mb-6">{company.description}</p>
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

        {company && company.hiring_tags && company.hiring_tags.length > 0 && (
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-neutral-900 mt-12 mb-12">Opportunities</h1>
            <div className="space-y-3">
              {company.hiring_tags.map((role: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <span className="font-medium text-neutral-900">{role}</span>
                  {company.partner && !company.pending_partner ? (
                    <ApplyButton company={company.company.toString()} />
                  ) : company.pending_partner ? (
                    <EarlyInterestButton company={company.company.toString()} />
                  ) : (
                    <span className="text-sm text-neutral-500">Not a partner</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Company Profile/Article */}
        <h1 className="text-3xl font-semibold text-neutral-900 mt-12 mb-12">Our Company Profile</h1>

        {companyPost && companyPost.body && Array.isArray(companyPost.body) && companyPost.body.length > 0 ? (
          <div className="mb-12">
            <PortableText value={companyPost.body} components={components} />
          </div>
        ) : (
           <Alert className="cursor-pointer hover:bg-gray-50" onClick={() => router.push('/articles')}>
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Company Profile Coming Soon</span>
                </AlertDescription>
              </Alert>
        )}


        {/* Team Members */}
        {/* {company.people && company.people.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6" title="Our direct partners at the company">Our Partners</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.people.map((person, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-neutral-900 mb-2">{person.name}</h3>
                  {person.media_url && (
                    <a
                      href={person.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Profile
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Users Who Bookmarked This Company */}
        {!isLoadingBookmarks && (
          <div className="mt-12 mb-12">
            <h1 className="text-3xl font-semibold text-neutral-900 mb-6">
                  People in Your Network Who We Think Would Be A Good Fit Here ({bookmarkedUsers.length})
                </h1>
            {bookmarkedUsers.length > 0 ? (
              <>
                <div className="space-y-4">
                  {bookmarkedUsers.map((user) => (
                    <ProfileCard
                      key={user.id}
                      profile={{
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
                      }}
                      onClick={() => {
                        router.push(`/people/${encodeSimple(user.id)}`);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Alert className="cursor-pointer hover:bg-gray-50" onClick={() => router.push('/people')}>
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">Build your verified community to see</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}      
      </div>
    </Container>
  );
}