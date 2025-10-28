import { ProfileData, CompanyWithImageUrl, FeedItem, ReferralWithProfile } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Linkedin, Globe, Edit, Plus, Send, Users } from "lucide-react";
import { useEffect, useState, useCallback } from 'react';
import ProfileAvatar from "./profile_avatar";
import { CompanyCard } from "./company-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedThread } from "./feed-thread";
import { ProjectsGrid } from "./projects-grid";
import ProfileCard from "./profile_card";
import { useRouter } from "next/navigation";
import { encodeSimple } from "../utils/simple-hash";
import { ReferralDialog } from "./referral-dialog";
import Post from "./post";
import { ProjectsDialog } from "@/app/components/projects_dialog";

interface ExternalProfileProps extends ProfileData {
  isExternalView?: boolean;
}

export function ExternalProfile(props: ExternalProfileProps) {
  const router = useRouter();
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  
  // Threads state
  const [userThreads, setUserThreads] = useState<FeedItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  
  // Referrals state
  const [userReferrals, setUserReferrals] = useState<ReferralWithProfile[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Projects state
  const [userProjects, setUserProjects] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsDialog, setProjectsDialog] = useState(false);

  // Editing state
  const [editingBio, setEditingBio] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [bioValue, setBioValue] = useState(props.bio || '');
  const [interestsValue, setInterestsValue] = useState(props.interests || '');
  const [saving, setSaving] = useState<'bio' | 'interests' | 'project_urls' | null>(null);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'threads' | 'referrals' | 'projects'>('bookmarks');

  // Save field function
  const saveField = async (field: 'bio' | 'interests' | 'project_urls', value: string) => {
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


  // Fetch user posts
  const fetchUserProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(`/api/get_user_projects?user_id=${props.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const projects = await response.json();
        setUserProjects(projects.project_urls || []);
      } else {
        console.error('Failed to fetch user projects');
        setUserProjects([]);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [props.id]);

  const handleProjectDeleted = (deletedProjectUrl: string) => {
    setUserProjects(prev => prev.filter(url => url !== deletedProjectUrl));
  };

  // Fetch user threads
  const fetchUserThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const response = await fetch(`/api/get_user_threads?user_id=${props.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const threads = await response.json();
        setUserThreads(threads);
      } else {
        console.error('Failed to fetch user threads');
        setUserThreads([]);
      }
    } catch (error) {
      console.error('Error fetching user threads:', error);
      setUserThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [props.id]);

  // Fetch user referrals
  const fetchUserReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      const response = await fetch(`/api/get_user_referrals?user_id=${props.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const referrals = await response.json();
        setUserReferrals(referrals);
      } else {
        console.error('Failed to fetch user referrals');
        setUserReferrals([]);
      }
    } catch (error) {
      console.error('Error fetching user referrals:', error);
      setUserReferrals([]);
    } finally {
      setLoadingReferrals(false);
    }
  }, [props.id]);
  
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
    fetchUserThreads();
    fetchUserReferrals();
    fetchUserProjects();
  }, [props.bookmarked_companies, props.company_recommendations, props.id, fetchUserReferrals, fetchUserThreads, fetchUserProjects  ]);
    if (!props) return <Skeleton className="h-12 w-full" />; // or customize size;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
          {props.first_name} {props.last_name}
        </h1>
        <div className="text-base text-neutral-600">
          {props.status}
          {props.is_public_profile && "Public Profile"}
          {props.newsletter_opt_in && " · Newsletter Opt-in"}
        </div>
      </div>

      <section className="space-y-8">
          {/* Header with large profile picture */}
          <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
            {/* Large Profile Picture - Left Side */}
            <div className="flex-shrink-0 lg:self-center">
              <ProfileAvatar
                name={`${props.first_name || ''} ${props.last_name || ''}`.trim() || 'User'}
                imageUrl={props.profile_image_url || undefined}
                size={280}
                editable={false}
                className="w-70 h-70 rounded-full mx-auto lg:mx-0"
              />
            </div>

            {/* User Info, Bio, and Interests - Right Side */}
            <div className="flex-1 space-y-6">
              {/* Content starts with Bio section */}

              {/* Bio Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-900">Bio</h3>
                  {!props.isExternalView && !editingBio && (
                    <Button
                      onClick={() => setEditingBio(true)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {!props.isExternalView && editingBio ? (
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

              {/* Interests Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-900">Interests</h3>
                  {!props.isExternalView && !editingInterests && (
                    <Button
                      onClick={() => setEditingInterests(true)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {!props.isExternalView && editingInterests ? (
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
            </div>
          </div>

          {/* Links and Documents */}
          {(props.linkedin_url || props.personal_website || props.transcript_url || props.resume_url) && (
            <div className="flex flex-wrap gap-3">
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

          {/* Tabbed Activity Section */}
          <div className="w-full mt-8 mb-8">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'bookmarks'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {props.isExternalView ? `Companies ${props.first_name} Bookmarked` : 'Bookmarked Companies'} ({bookmarkedCompanies.length})
                </button>
                <button
                  onClick={() => setActiveTab('threads')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'threads'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {props.isExternalView ? `${props.first_name}'s Threads` : 'Your Threads'} ({userThreads.length})
                </button>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'referrals'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {props.isExternalView ? `${props.first_name}'s Referrals` : 'Your Referrals'} ({userReferrals.length})
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'projects'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {props.isExternalView ? `${props.first_name}'s Projects` : 'Your Projects'} ({userProjects.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Bookmarked Companies Tab */}
              {activeTab === 'bookmarks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Bookmarked and Recommended</h3>
                    {!props.isExternalView && (
                      <Button
                        onClick={() => window.location.href = '/opportunities'}
                        size="sm"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Opportunities
                      </Button>
                    )}
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
                      {props.isExternalView ? `${props.first_name} hasn't bookmarked any companies yet.` : "You haven't bookmarked any companies yet."}
                    </div>
                  )}
                </div>
              )}

              {/* User Threads Tab */}
              {activeTab === 'threads' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Your Threads</h3>
                    {!props.isExternalView && (
                      <Post
                        triggerElement={
                          <Button
                            size="sm"
                            className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Thread Your Thoughts
                          </Button>
                        }
                      />
                    )}
                  </div>
                  {loadingThreads ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ) : userThreads.length > 0 ? (
                    <div className="space-y-6">
                      {userThreads.map((thread) => (
                        <FeedThread key={thread.id} feedItem={thread} />
                      ))}
                      {userThreads.length > 5 && (
                        <div className="text-center pt-4">
                          <Button
                            onClick={() => window.location.href = '/feed'}
                            variant="outline"
                            className="text-neutral-600 hover:text-neutral-800"
                          >
                            View more threads
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {props.isExternalView ? `${props.first_name} hasn't posted any threads yet.` : "You haven't posted any threads yet."}
                    </div>
                  )}
                </div>
              )}

              {/* User Referrals Tab */}
              {activeTab === 'referrals' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Your Referrals</h3>
                    {!props.isExternalView && (
                      <Button
                        onClick={() => setShowReferralDialog(true)}
                        size="sm"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Refer to The Niche Network
                      </Button>
                    )}
                  </div>
                  {loadingReferrals ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                      <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                  ) : userReferrals.length > 0 ? (
                    <div className="space-y-4">
                      {userReferrals.map((referral) => (
                        referral.subscriber_profile ? (
                          <ProfileCard
                            key={referral.id}
                            profile={referral.subscriber_profile}
                            onClick={() => {
                              if (referral.subscriber_profile?.id) {
                                const encodedId = encodeSimple(referral.subscriber_profile.id);
                                router.push(`/people/${encodedId}`);
                              }
                            }}
                            connectionStatus="connected"
                          />
                        ) : (
                          <div key={referral.id} className="bg-white border border-neutral-200 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-8 h-8 text-neutral-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-neutral-900">
                                  {referral.referral_name}
                                </h4>
                                <p className="text-sm text-neutral-600">{referral.referral_email}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                    Invitation Sent
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {props.isExternalView ? `${props.first_name} hasn't referred anyone yet.` : "You haven't referred anyone yet."}
                    </div>
                  )}
                </div>
              )}

              {/* User Threads Tab */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Your Projects</h3>
                    {!props.isExternalView && (
                      <Button
                        size="sm"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                        onClick={() => setProjectsDialog(true)}
                      >
                        <Plus className="w-4 h-4" />
                        Add Projects and Media
                      </Button>
                    )}
                  </div>
                  {loadingProjects ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ) : userProjects.length > 0 ? (
                    <ProjectsGrid 
                      projectUrls={userProjects} 
                      onProjectDeleted={handleProjectDeleted}
                      showDelete={!props.isExternalView}
                    />
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {props.isExternalView ? `${props.first_name} hasn't linked any projects yet.` : "You haven't linked any projects yet."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      </section>
      
      {/* Referral Dialog - Only show for own profile */}
      {!props.isExternalView && (
        <ReferralDialog 
          open={showReferralDialog} 
          onOpenChange={setShowReferralDialog}
          title="Refer Someone You Want to Bring To Your Verified Professional Network"
          description="We are personal referral only and will verify if your referral is a good fit for our partner companies!"
        />
      )}
      {/* Projects Dialog - Only show for own profile */}
      {!props.isExternalView && (
        <ProjectsDialog
          open={projectsDialog}
          onOpenChange={setProjectsDialog}
          title="Add Projects and Media"
          description="Showcase your work and achievements to your network."
          onProjectAdded={fetchUserProjects}
        />
      )}
    </div>
  );
}