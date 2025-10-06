"use client";
import { useEffect, useState } from "react";
import { Navigation } from "../../components/header";
import { Container } from "../../components/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProfileData, CompanyWithImageUrl } from "@/app/types";
import ProfileAvatar from "@/app/components/profile_avatar";
import { Linkedin, Globe, FileText } from "lucide-react";
import { decodeSimple } from "@/app/utils/simple-hash";
import { CompanyCard } from "../../components/company-card";

export default function ExternalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [decodedId, setDecodedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setProfileId(id);
      
      // Decode the hashed ID to get the real database ID
      const realId = decodeSimple(id);
      if (!realId) {
        console.error('Invalid profile ID format:', id);
        setError('Invalid profile link');
        setData(null);
        setDecodedId(null);
        return;
      }
      
      setDecodedId(realId);
      
      // Fetch profile data using the external profile API with the hashed ID
      const apiUrl = `/api/get_external_profile?id=${id}`;
      
      fetch(apiUrl)
        .then(res => {
          return res.json();
        })
        .then(data => {
          setData(data);
        })
        .catch(error => {
          setData(null);  
          setError('Profile not found');
          console.error('Error fetching profile:', error);
        });
    };
    
    getParams();
  }, [params]);

  // Fetch bookmarked companies using API
  useEffect(() => {
    const fetchBookmarkedCompanies = async () => {
      if (!data?.bookmarked_companies) {
        setBookmarkedCompanies([]);
        return;
      }
      setLoadingBookmarks(true);
      try {
        const response = await fetch('/api/companies', {
          credentials: 'include'
        });
        if (response.ok) {
          const allCompanies = await response.json();
          
          // Filter companies based on bookmarked company IDs
          const filteredCompanies = allCompanies.filter((company: CompanyWithImageUrl) => 
            data.bookmarked_companies?.includes(company.company)
          );
          setBookmarkedCompanies(filteredCompanies);
        }
      } catch (error) {
        console.error('Error fetching bookmarked companies:', error);
        setBookmarkedCompanies([]);
      } finally {
        setLoadingBookmarks(false);
      }
    };
    fetchBookmarkedCompanies();
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
        <Navigation />
        <div className="pt-12 pb-8 px-6 relative">
          <Container className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Profile Not Found</h1>
              <p className="text-neutral-600">{error}</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  if (!data || !profileId || !decodedId) return <Skeleton className="h-12 w-full" />

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      <Navigation />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.02),transparent)] pointer-events-none"></div>
        <Container className="max-w-4xl mx-auto">
          <section className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-6">
              <ProfileAvatar
                name={`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User'}
                imageUrl={data.profile_image_url || undefined}
                size={128}
                editable={false}
                className="w-32 h-32 rounded-full"
              />

              <div className="min-w-0">
                <h2 className="text-3xl font-semibold text-neutral-900 truncate">
                  {data.first_name} {data.last_name}
                </h2>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {data.status && (
                    <span className="text-neutral-600">{data.status}</span>
                  )}
                  {data.is_public_profile && (
                    <span className="text-neutral-500">· Public</span>
                  )}
                  {data.newsletter_opt_in && (
                    <span className="text-neutral-500">· Newsletter Opt-in</span>
                  )}
                </div>
              </div>
            </div>

            {data.bio && data.bio.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-900">Bio</h3>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                    {data.bio}
                  </div>
                </div>
              </div>
            )}

            {/* Interests */}
            {data.interests && data.interests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-900">Interests</h3>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                    {data.interests}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis from The Niche */}
            {data.generated_interest_profile && data.generated_interest_profile.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-900">Analysis From The Niche</h3>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                    {data.generated_interest_profile}
                  </div>
                </div>
              </div>
            )}

            {/* Links and Documents */}
            {(data.linkedin_url || data.personal_website || data.transcript_url || data.resume_url) && (
              <div className="flex flex-wrap gap-3">
                {data.linkedin_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {data.personal_website && (
                  <Button asChild variant="outline" size="sm">
                    <a href={data.personal_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {data.transcript_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={data.transcript_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Transcript
                    </a>
                  </Button>
                )}
                {data.resume_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={data.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Resume
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Bookmarked Companies Section */}
            <div className="w-full space-y-6">
              <h3 className="text-lg font-medium text-neutral-900">Companies {data.first_name} Bookmarked</h3>
              {loadingBookmarks ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              ) : bookmarkedCompanies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {bookmarkedCompanies.map((company) => (
                    <CompanyCard key={company._id} company={company} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  {data.first_name} hasn&apos;t bookmarked any companies yet.
                </div>
              )}
            </div>
            
            <div className="text-center text-sm text-neutral-600 py-8">
              Company Profile
              <div className="mt-2 text-neutral-500">
                A simplified view for partner companies on the Niche to review your profile with verified and additional information.
              </div>
            </div>
          </section>
        </Container>
      </div>
    </div>
  );
}