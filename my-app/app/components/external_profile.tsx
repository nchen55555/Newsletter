import { ProfileData, CompanyWithImageUrl } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Linkedin, Globe, Edit, Plus } from "lucide-react";
import { useEffect, useState } from 'react';
import ProfileAvatar from "./profile_avatar";
import { CompanyCard } from "./company-card";
import { Skeleton } from "@/components/ui/skeleton";


export function ExternalProfile(props: ProfileData) {
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  
  // Editing state
  const [editingBio, setEditingBio] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [bioValue, setBioValue] = useState(props.bio || '');
  const [interestsValue, setInterestsValue] = useState(props.interests || '');
  const [saving, setSaving] = useState<'bio' | 'interests' | null>(null);

  // Save field function
  const saveField = async (field: 'bio' | 'interests', value: string) => {
    setSaving(field);
    try {
      const formData = new FormData();
      formData.append('id', props.id.toString());
      formData.append(field, value);

      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        // Update was successful
        if (field === 'bio') {
          setEditingBio(false);
        } else {
          setEditingInterests(false);
        }
      } else {
        console.error('Failed to update', field);
        alert(`Failed to update ${field}. Please try again.`);
      }
    } catch (error) {
      console.error('Error updating', field, error);
      alert(`Error updating ${field}. Please try again.`);
    } finally {
      setSaving(null);
    }
  };

  console.log("ExternalProfile props:", props);
  
    // Fetch bookmarked companies using API
    useEffect(() => {
      const fetchBookmarkedCompanies = async () => {
        if (!props.bookmarked_companies || props.bookmarked_companies.length === 0) {
          setBookmarkedCompanies([]);
          return;
        }
        setLoadingBookmarks(true);
        console.log("loading bookmarks");
        try {
          const response = await fetch('/api/companies', {
            credentials: 'include'
          });
          if (response.ok) {
            const allCompanies = await response.json();

             console.log("all companies ", allCompanies);

            // Filter companies based on bookmarked company IDs
            const filteredCompanies = allCompanies.filter((company: CompanyWithImageUrl) =>
              props.bookmarked_companies?.includes(company.company) || props.company_recommendations?.includes(company.company)
            );

            console.log("filtered companies ", filteredCompanies);
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
    }, [props.bookmarked_companies, props.company_recommendations]);
    if (!props) return <Skeleton className="h-12 w-full" />; // or customize size;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Your Profile
          </h1>
          <p className="mt-2 text-sm md:text-base text-neutral-600">
            Customize your profile to best represent your interests and the opportunities that come your way. 
          </p>
        </div>
        {/* <Button
          onClick={() => router.push(`/edit_profile/${encodeSimple(props.id)}`)}
          className="mt-2"
          variant="ghost"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Edit Profile
        </Button> */}
      </div>

      <section className="space-y-8">
          {/* Header (no gradient, no outline) */}
          <div className="flex items-center gap-4">
            <ProfileAvatar
              name={`${props.first_name || ''} ${props.last_name || ''}`.trim() || 'User'}
              imageUrl={props.profile_image_url || undefined}
              size={96}
              editable={false}
              className="w-24 h-24 rounded-full"
            />

            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-neutral-900 truncate">
                {props.first_name} {props.last_name}
              </h2>
              <div className="mt-1 text-xs text-neutral-600">
                {props.status}
                {props.is_public_profile && " · Public Profile"}
                {props.newsletter_opt_in && " · Newsletter Opt-in"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-900">Bio</h3>
              {!editingBio && (
                <Button
                  onClick={() => setEditingBio(true)}
                  variant="ghost"
                  size="sm"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {editingBio ? (
              <div className="space-y-3">
                <Textarea
                  value={bioValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBioValue(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[120px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveField('bio', bioValue)}
                    disabled={saving === 'bio'}
                    size="sm"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white"
                  >
                    {saving === 'bio' ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingBio(false);
                      setBioValue(props.bio || '');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                  {bioValue || 'No bio added yet.'}
                </div>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-900">Interests</h3>
              {!editingInterests && (
                <Button
                  onClick={() => setEditingInterests(true)}
                  variant="ghost"
                  size="sm"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {editingInterests ? (
              <div className="space-y-3">
                <Textarea
                  value={interestsValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterestsValue(e.target.value)}
                  placeholder="AI/ML, fintech, climate tech, product management, backend engineering..."
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveField('interests', interestsValue)}
                    disabled={saving === 'interests'}
                    size="sm"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white"
                  >
                    {saving === 'interests' ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingInterests(false);
                      setInterestsValue(props.interests || '');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                  {interestsValue || 'No interests added yet.'}
                </div>
              </div>
            )}
          </div>

          {/* Analysis from The Niche */}
          {props.generated_interest_profile && props.generated_interest_profile.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Analysis From The Niche</h3>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                  {props.generated_interest_profile}
                </div>
              </div>
            </div>
          )}

          {/* Bookmarked Companies Section */}
            <div className="w-full space-y-6 mt-8 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">Bookmarked and Recommended</h3>
                <Button
                  onClick={() => window.location.href = '/opportunities'}
                  size="sm"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Opportunities
                </Button>
              </div>
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
                  You haven&apos;t bookmarked any companies yet.
                </div>
              )}
            </div>

          {/* Links and Documents */}
          {(props.linkedin_url || props.personal_website || props.transcript_url || props.resume_url) && (
            <div className="flex flex-wrap gap-3 mt-8">
              {props.linkedin_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {props.personal_website && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.personal_website.startsWith('http') ? props.personal_website : `https://${props.personal_website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {props.transcript_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.transcript_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Transcript
                  </a>
                </Button>
              )}
              {props.resume_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Resume
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="text-center text-sm text-neutral-600 py-8">
            Company Profile
            <div className="mt-2 text-neutral-500">
              A simplified view for partner companies on the Niche to review your profile with verified and additional information.
            </div>
          </div>
      </section>
    </div>
  );
}