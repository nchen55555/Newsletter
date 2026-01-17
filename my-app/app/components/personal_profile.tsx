"use client";

import { ProfileData } from "@/app/types";
import { CompanyWithImageUrl } from "@/app/types";
import { CompanyData } from "@/app/types/match-types";
import { ProjectsTab } from "./external_profile/projects_tab";
import { Button } from "@/components/ui/button";
import { FileText, Linkedin, Globe, Edit, Github, Plus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Container } from './container';
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { useEffect, useState, useCallback } from 'react';
import ProfileAvatar from "./profile_avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { ReferralDialog } from "./referral-dialog";
import { ProjectsDialog } from "./projects_dialog";
import { AddFileDialog } from "./add-file-dialog";
import { InformationDialog } from "./information-dialog";
import { UserCheckInComponent } from "./user_check_in_component";
import { NetworkConnectionsGrid } from "./network-connections-grid";
import { BookmarkedCompaniesGrid } from "./bookmarked-companies-grid";
import { DEFAULT_VISIBILITY_SETTINGS, VisibilitySelector, type VisibilityLevel } from "./visibility";
import { Switch } from "@/components/ui/switch";
import type { UserStatus } from "@/app/components/user_check_in_component";
import { ConnectionBreakdownChart } from "./connection-breakdown-chart";
import { ProfessionalReputationCard } from "./professional_reputation_card";

interface PersonalProfileProps extends ProfileData {
  onRefresh?: () => void | Promise<void>;
}

export function PersonalProfile(props: PersonalProfileProps) {
  const router = useRouter();

  // ---------- Basic profile / config ----------
  // const githubAnalysis: GitHubProfileAnalysis | null = (() => {
  //   try {
  //     if (typeof props.github_url_data === 'string') {
  //       return JSON.parse(props.github_url_data);
  //     }
  //     return props.github_url_data || null;
  //   } catch {
  //     return null;
  //   }
  // })();

  // ---------- State ----------
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<(CompanyWithImageUrl)[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [connectionProfiles, setConnectionProfiles] = useState<ProfileData[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Projects state
  const [userProjects, setUserProjects] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsDialog, setProjectsDialog] = useState(false);

  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showInformationDialog, setShowInformationDialog] = useState(props.applied === false);

  // Edit state
  const [editingBio, setEditingBio] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // Dialog state for adding files/links
  const [addFileDialog, setAddFileDialog] = useState<{
    open: boolean;
    fieldType: string;
    fieldTitle: string;
    allowFile: boolean
  }>({
    open: false,
    fieldType: '',
    fieldTitle: '',
    allowFile: false
  });

  const [bioValue, setBioValue] = useState(props.bio || "");
  const [interestsValue, setInterestsValue] = useState(props.interests || "");
  const [firstNameValue, setFirstNameValue] = useState(props.first_name || "");
  const [lastNameValue, setLastNameValue] = useState(props.last_name || "");
  const [editFormLoading, setEditFormLoading] = useState(false);

  // Local toggles for profile-level flags
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(props.is_public_profile ?? true);
  const [newsletterOptIn, setNewsletterOptIn] = useState<boolean>(props.newsletter_opt_in ?? true);
  const [needsVisaSponsorship, setNeedsVisaSponsorship] = useState<boolean>(props.needs_visa_sponsorship ?? false);

  // Track if profile activation toast has been shown
  const [hasShownActivationToast, setHasShownActivationToast] = useState(false);

  // Visibility settings for different sections
  const [visibilitySettings, setVisibilitySettings] = useState({
    bio: props.visibility_profile_settings?.bio || DEFAULT_VISIBILITY_SETTINGS.bio,
    interests: props.visibility_profile_settings?.interests || DEFAULT_VISIBILITY_SETTINGS.interests,
    projects: props.visibility_profile_settings?.projects || DEFAULT_VISIBILITY_SETTINGS.projects,
    links: props.visibility_profile_settings?.links || DEFAULT_VISIBILITY_SETTINGS.links,
    documents: props.visibility_profile_settings?.documents || DEFAULT_VISIBILITY_SETTINGS.documents,
    network: props.visibility_profile_settings?.network || DEFAULT_VISIBILITY_SETTINGS.network,
    companies: props.visibility_profile_settings?.companies || DEFAULT_VISIBILITY_SETTINGS.companies,
    priorities: props.visibility_profile_settings?.priorities || DEFAULT_VISIBILITY_SETTINGS.priorities,
  });

  // Save visibility settings immediately when changed
  const saveVisibilitySettings = async (newSettings: typeof visibilitySettings) => {
    try {
      await fetch('/api/visibility_update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: props.id,
          visibility_profile_settings: newSettings
        }),
      });
    } catch (error) {
      console.error('Error saving visibility settings:', error);
    }
  };

  const handleSave = async (field: string, value: string | Record<string, string>) => {
    setEditFormLoading(true);

    try {
      const formData = new FormData();
      formData.append('id', props.id.toString());

      if (typeof value === 'string') {
        formData.append(field, value);
      } else {
        Object.entries(value).forEach(([key, val]) => {
          formData.append(key, val);
        });
      }

      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        setEditingBio(false);
        setEditingInterests(false);
        setEditingName(false);

        if (props.onRefresh) {
          await props.onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to update: ${errorData.error || 'Unknown error'}`);
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setEditFormLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const formData = new FormData();
      formData.append('id', props.id.toString());
      formData.append('applied', 'true');

      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        toast.success("Profile published successfully!");
        if (props.onRefresh) {
          await props.onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        toast.error("Failed to publish profile. Please try again.");
      }
    } catch (error) {
      console.error('Error publishing profile:', error);
      toast.error("An error occurred while publishing your profile.");
    }
  };

  // Fetch bookmarked companies
  const fetchBookmarkedCompanies = useCallback(async () => {
    if (!props.bookmarked_companies || props.bookmarked_companies.length === 0) {
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
        const filteredCompanies = allCompanies.filter((company: CompanyData & { imageUrl: string | null }) =>
          props.bookmarked_companies?.includes(company.company as number)
        );
        setBookmarkedCompanies(filteredCompanies);
      }
    } catch (error) {
      console.error('Error fetching bookmarked companies:', error);
      setBookmarkedCompanies([]);
    } finally {
      setLoadingBookmarks(false);
    }
  }, [props.bookmarked_companies]);

  // Fetch connection profiles
  const fetchConnectionProfiles = useCallback(async () => {
    if (!props.connections_new || props.connections_new.length === 0) {
      setConnectionProfiles([]);
      return;
    }

    setLoadingConnections(true);
    try {
      const profiles = await Promise.all(
        props.connections_new.map(async (connection) => {
          try {
            const res = await fetch(`/api/get_external_profile?id=${connection.connect_id}`, {
              credentials: 'include'
            });
            if (res.ok) {
              const profile = await res.json();
              return {
                ...profile,
                connectionRating: connection.rating,
                connectionNote: connection.note,
                alignmentValue: connection.alignment_value,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching profile ${connection.connect_id}:`, error);
            return null;
          }
        })
      );

      setConnectionProfiles(profiles.filter((p): p is ProfileData => p !== null));
    } catch (error) {
      console.error('Error fetching connection profiles:', error);
      setConnectionProfiles([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [props.connections_new]);

  // Fetch user projects
  const fetchUserProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(`/api/get_user_projects?user_id=${props.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserProjects(data.project_urls || []);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, [props.id]);

  const handleProjectDeleted = async (projectId: string) => {
    try {
      const response = await fetch(`/api/delete_project`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: props.id,
          project_id: projectId
        })
      });

      if (response.ok) {
        await fetchUserProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  useEffect(() => {
    fetchBookmarkedCompanies();
  }, [fetchBookmarkedCompanies]);

  useEffect(() => {
    fetchConnectionProfiles();
  }, [fetchConnectionProfiles]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  // Monitor profile completion and show toast when ready to activate
  useEffect(() => {
    const isDisabled = props.bio == null || props.profile_image_url == null || props.linkedin_url == null || props.check_in_status == null;

    if (!isDisabled && !hasShownActivationToast && props.applied === false) {
      toast.success("You Can Activate Profile Now");
      setHasShownActivationToast(true);
    }
  }, [props.bio, props.profile_image_url, props.linkedin_url, props.resume_url, props.check_in_status, props.applied, hasShownActivationToast]);

  const connectionData = connectionProfiles
    .filter(conn => conn.connectionRating !== undefined)
    .map(conn => ({
      connect_id: conn.id,
      rating: conn.connectionRating!,
      alignment_value: conn.alignmentValue!,
      note: conn.connectionNote
    }));

  if (!props) return <Skeleton className="h-12 w-full" />;

  return (
    <SidebarLayout title="Profile">
      <Toaster />
      <div className="pt-12 pb-8 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"></div>
        <Container>
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  {editingName ? (
                    <div className="space-y-3 mb-2">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={firstNameValue}
                          onChange={(e) => setFirstNameValue(e.target.value)}
                          className="text-3xl md:text-4xl font-bold text-neutral-200 bg-white border border-gray-300 rounded px-2 py-1 flex-1"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          value={lastNameValue}
                          onChange={(e) => setLastNameValue(e.target.value)}
                          className="text-3xl md:text-4xl font-bold text-neutral-200 bg-white border border-gray-300 rounded px-2 py-1 flex-1"
                          placeholder="Last name"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingName(false)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSave('name', { first_name: firstNameValue, last_name: lastNameValue })}
                          disabled={editFormLoading}
                          size="sm"
                        >
                          {editFormLoading ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold">
                        {props.first_name} {props.last_name}
                      </h1>
                      <Button
                        onClick={() => setEditingName(true)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="py-4 space-y-2 text-sm text-neutral-400">
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={isPublicProfile}
                          onCheckedChange={async (value) => {
                            setIsPublicProfile(value);
                            await handleSave("is_public_profile", { is_public_profile: String(value) });
                          }}
                        />
                        <span>Public Profile</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={newsletterOptIn}
                          onCheckedChange={async (value) => {
                            setNewsletterOptIn(value);
                            await handleSave("newsletter_opt_in", { newsletter_opt_in: String(value) });
                          }}
                        />
                        <span>Opt-in for Company Profile Updates</span>
                      </label>
                      {props.needs_visa_sponsorship !== undefined && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={needsVisaSponsorship}
                            onCheckedChange={async (value) => {
                              setNeedsVisaSponsorship(value);
                              await handleSave("needs_visa_sponsorship", { needs_visa_sponsorship: String(value) });
                            }}
                          />
                          <span>
                            {needsVisaSponsorship ? "Needs Visa Sponsorship" : "No Visa Sponsorship Needed"}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  {props.applied === false && (
                    <Button
                      onClick={() => {
                        handlePublish();
                        setShowReferralDialog(true);
                      }}
                      className="text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:text-white"
                      disabled={props.bio == null || props.profile_image_url == null || props.linkedin_url == null || props.check_in_status == null}
                    >
                      Activate Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <section className="space-y-3">
              {/* Header with large profile picture */}
              <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
                {/* Large Profile Picture - Left Side */}
                <div className="flex-shrink-0 flex flex-col">
                  <ProfileAvatar
                    name={`${props.first_name || ''} ${props.last_name || ''}`.trim() || 'User'}
                    imageUrl={props.profile_image_url || undefined}
                    size={280}
                    editable={true}
                    onSelectFile={(file) => {
                      const formData = new FormData();
                      formData.append('id', props.id.toString());
                      formData.append('profile_image', file);

                      fetch('/api/post_profile', {
                        method: 'PATCH',
                        body: formData,
                      }).then(response => {
                        if (response.ok) {
                          window.location.reload();
                        }
                      });
                    }}
                    className="w-70 h-70 rounded-full mx-auto lg:mx-0"
                  />
                  <p className="text-sm text-neutral-200 text-center mt-2">
                    Upload a profile photo <span className="text-red-500 ml-1">*</span>
                  </p>
                </div>

                {/* User Info, Bio, and Interests - Right Side */}
                <div className="flex-1 space-y-6">
                  {/* Bio Section */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-neutral-200">
                        Bio {(!props.bio || props.bio.trim() === '') && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      {!editingBio && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setEditingBio(true)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <VisibilitySelector
                            currentVisibility={visibilitySettings.bio as VisibilityLevel}
                            onVisibilityChange={(visibility) => {
                              const newSettings = {...visibilitySettings, bio: visibility};
                              setVisibilitySettings(newSettings);
                              saveVisibilitySettings(newSettings);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {editingBio ? (
                      <div className="space-y-3">
                        <div className="rounded-lg p-4 bg-white border-2 border-gray-300">
                          <textarea
                            value={bioValue}
                            onChange={(e) => setBioValue(e.target.value)}
                            className="w-full text-sm leading-relaxed text-neutral-400 bg-transparent border-none resize-none focus:outline-none min-h-[100px]"
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setBioValue(props.bio || "");
                              setEditingBio(false);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSave('bio', bioValue)}
                            disabled={editFormLoading}
                            size="sm"
                          >
                            {editFormLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg p-4">
                        {props.bio && props.bio.trim() !== '' ? (
                          <div className="text-sm text-neutral-400">
                            {props.bio}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-500">
                            No bio added yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Interests Section */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-neutral-200">
                        Interests
                      </h3>
                      {!editingInterests && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setEditingInterests(true)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <VisibilitySelector
                            currentVisibility={visibilitySettings.interests as VisibilityLevel}
                            onVisibilityChange={(visibility) => {
                              const newSettings = {...visibilitySettings, interests: visibility};
                              setVisibilitySettings(newSettings);
                              saveVisibilitySettings(newSettings);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {editingInterests ? (
                      <div className="space-y-3">
                        <div className="rounded-lg p-4 bg-white border-2 border-gray-300">
                          <textarea
                            value={interestsValue}
                            onChange={(e) => setInterestsValue(e.target.value)}
                            className="w-full text-sm leading-relaxed text-neutral-400 bg-transparent border-none resize-none focus:outline-none min-h-[80px]"
                            placeholder="What are you interested in?"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setInterestsValue(props.interests || "");
                              setEditingInterests(false);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSave('interests', interestsValue)}
                            disabled={editFormLoading}
                            size="sm"
                          >
                            {editFormLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg p-4">
                        {props.interests && props.interests.trim() !== '' ? (
                          <div className="text-sm text-neutral-400">
                            {props.interests}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">
                            No interests added yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Links and Documents - Two Column Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-18 mt-8 mb-8">
                {/* Left Column: Highlighted Links */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-medium text-neutral-200">
                      Highlighted Media
                    </h3>
                    <div className="flex items-center gap-2">
                      <VisibilitySelector
                        currentVisibility={visibilitySettings.links as VisibilityLevel}
                        onVisibilityChange={(visibility) => {
                          const newSettings = {...visibilitySettings, links: visibility};
                          setVisibilitySettings(newSettings);
                          saveVisibilitySettings(newSettings);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* LinkedIn URL - Required */}
                    <div className="relative group">
                      {props.linkedin_url ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <a href={props.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center pr-8">
                              <Linkedin className="w-4 h-4 mr-2" />
                              LinkedIn
                            </a>
                          </Button>
                          <button
                            onClick={() => handleSave('linkedin_url', '')}
                            className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => setAddFileDialog({
                            open: true,
                            fieldType: 'linkedin_url',
                            fieldTitle: 'LinkedIn URL',
                            allowFile: false
                          })}
                            className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                        >
                          LinkedIn URL <span className="text-red-400">*</span>
                        </div>
                      )}
                    </div>

                    {/* Personal Website - Optional */}
                    <div className="relative group">
                      {props.personal_website ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <a href={props.personal_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center pr-8">
                              <Globe className="w-4 h-4 mr-2" />
                              Personal Website
                            </a>
                          </Button>
                          <button
                            onClick={() => handleSave('personal_website', '')}
                            className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => setAddFileDialog({
                            open: true,
                            fieldType: 'personal_website',
                            fieldTitle: 'Personal Website',
                            allowFile: false
                          })}
                          className="border-2 border-dashed border-gray-300 rounded px-3 py-1 text-sm text-gray-400 cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                        >
                          Personal Website
                        </div>
                      )}
                    </div>

                    {/* Github URL - Optional */}
                    <div className="relative group">
                      {props.github_url ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <a href={props.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center pr-8">
                              <Github className="w-4 h-4 mr-2" />
                              Github URL
                            </a>
                          </Button>
                          <button
                            onClick={() => handleSave('github_url', '')}
                            className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => setAddFileDialog({
                            open: true,
                            fieldType: 'github_url',
                            fieldTitle: 'Github URL',
                            allowFile: false
                          })}
                          className="border-2 border-dashed border-gray-300 rounded px-3 py-1 text-sm text-gray-400 cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                        >
                          Github URL
                        </div>
                      )}
                    </div>

                    {/* Custom links */}
                    {props.custom_links &&
                      Object.entries(JSON.parse(props.custom_links)).map(([key, value]) => {
                        if (!value || typeof value !== 'string' || value.trim() === '') return null;
                        const label = key;
                        const icon = <FileText className="w-4 h-4 mr-2" />;
                        return (
                          <div key={key} className="relative group mb-2">
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center pr-8"
                              >
                                {icon}
                                {label}
                              </a>
                            </Button>
                            <button
                              onClick={() => {
                                const currentLinks = props.custom_links ? JSON.parse(props.custom_links) : {};
                                const updatedLinks = { ...currentLinks };
                                delete updatedLinks[key];
                                handleSave('custom_links', JSON.stringify(updatedLinks));
                              }}
                              className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                              title={`Remove ${label}`}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}

                    {/* Add Link/File Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddFileDialog({
                        open: true,
                        fieldType: '',
                        fieldTitle: '',
                        allowFile: false
                      })}
                      className="inline-flex items-center gap-2 border-dashed text-gray-400"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Right Column: Highlighted Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-medium text-neutral-200">
                      Highlighted Documents
                    </h3>
                    <div className="flex items-center gap-2">
                      <VisibilitySelector
                        currentVisibility={visibilitySettings.documents as VisibilityLevel}
                        onVisibilityChange={(visibility) => {
                          const newSettings = {...visibilitySettings, documents: visibility};
                          setVisibilitySettings(newSettings);
                          saveVisibilitySettings(newSettings);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* Resume - Required */}
                    <div className="relative group">
                      {props.resume_url ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <a href={props.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center pr-8">
                              <FileText className="w-4 h-4 mr-2" />
                              Resume
                            </a>
                          </Button>
                          <button
                            onClick={() => handleSave('resume_url', '')}
                            className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => setAddFileDialog({
                            open: true,
                            fieldType: 'resume_url',
                            fieldTitle: 'Resume',
                            allowFile: true
                          })}
                          className="border-2 border-dashed border-gray-300 rounded px-3 py-1 text-sm text-gray-400 cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                        >
                          Resume 
                        </div>
                      )}
                    </div>

                    {/* Transcript - Optional */}
                    <div className="relative group">
                      {props.transcript_url ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <a href={props.transcript_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center pr-8">
                              <FileText className="w-4 h-4 mr-2" />
                              Transcript
                            </a>
                          </Button>
                          <button
                            onClick={() => handleSave('transcript_url', '')}
                            className="absolute -top-1 -right-1 w-3 h-3 text-black bg-white border border-gray rounded-full flex items-center justify-center text-xs"
                          > 
                            ×
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => setAddFileDialog({
                            open: true,
                            fieldType: 'transcript_url',
                            fieldTitle: 'Transcript',
                            allowFile: true
                          })}
                          className="border-2 border-dashed border-gray-300 rounded px-3 py-1 text-sm text-gray-400 cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                        >
                          Transcript
                        </div>
                      )}
                    </div>

                    {/* Add Document Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddFileDialog({
                        open: true,
                        fieldType: '',
                        fieldTitle: '',
                        allowFile: false
                      })}
                      className="inline-flex items-center gap-2 border-dashed text-gray-400"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Priorities Section */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-neutral-200">
                  Professional Priorities and Timelines <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center gap-2">
                  <VisibilitySelector
                    currentVisibility={visibilitySettings.priorities as VisibilityLevel}
                    onVisibilityChange={(visibility) => {
                      const newSettings = {...visibilitySettings, priorities: visibility};
                      setVisibilitySettings(newSettings);
                      saveVisibilitySettings(newSettings);
                    }}
                  />
                </div>
              </div>

              <UserCheckInComponent
                initialStatus={props.check_in_status as UserStatus}
                initialTimeline={props.timeline_of_search}
                initialOutreachFrequency={props.outreach_frequency}
                isExternalView={false}
              />

              {/* Projects Section */}  
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-neutral-200">
                  Projects
                </h3>
                <div className="flex items-center gap-2">
                  <VisibilitySelector
                    currentVisibility={visibilitySettings.projects as VisibilityLevel}
                    onVisibilityChange={(visibility) => {
                      const newSettings = {...visibilitySettings, projects: visibility};
                      setVisibilitySettings(newSettings);
                      saveVisibilitySettings(newSettings);
                    }}
                  />
                </div>
              </div>

              <ProjectsTab
                isExternalView={false}
                userProjects={userProjects}
                loadingProjects={loadingProjects}
                onOpenProjectsDialog={() => setProjectsDialog(true)}
                onProjectDeleted={handleProjectDeleted}
              />

              {/* Network Section */}
              {props.applied && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-neutral-200">
                      Network
                    </h3>
                    <div className="flex items-center gap-2">
                      <VisibilitySelector
                        currentVisibility={visibilitySettings.network as VisibilityLevel}
                        onVisibilityChange={(visibility) => {
                          const newSettings = {...visibilitySettings, network: visibility};
                          setVisibilitySettings(newSettings);
                          saveVisibilitySettings(newSettings);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                  <div className="space-y-6 rounded-lg p-4">
                  <div className="text-sm text-neutral-400">
                    Curate your personalized, verified professional network by adding context to each connection, digitizing the real relationships behind your career.

                  </div>
                  <div className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="lg:col-span-1">
                        <ConnectionBreakdownChart connections={connectionData} />
                      </div>
                      <div className="lg:col-span-3">
                        <ProfessionalReputationCard connections={connectionData} />
                      </div>
                    </div>
                  </div>
                    
                    <NetworkConnectionsGrid
                      connections={connectionProfiles}
                      currentUserData={props}
                      onSeeAllConnections={() => router.push('/people')}
                      showSeeAll={true}
                      maxDisplay={7}
                      appliedToTheNiche={props.applied}
                      isExternalView={false}
                      loading={loadingConnections}
                    />
                    </div>
                  </div>
                </>
              )}

              {/* Companies Section */}
              {props.applied && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-neutral-200">
                      Companies
                    </h3>
                    <div className="flex items-center gap-2">
                      <VisibilitySelector
                        currentVisibility={visibilitySettings.companies as VisibilityLevel}
                        onVisibilityChange={(visibility) => {
                          const newSettings = {...visibilitySettings, companies: visibility};
                          setVisibilitySettings(newSettings);
                          saveVisibilitySettings(newSettings);
                        }}
                        allowedLevels={['public', 'connections']}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <BookmarkedCompaniesGrid
                      companies={bookmarkedCompanies}
                      onSeeAllCompanies={() => router.push('/opportunities')}
                      showSeeAll={true}
                      maxDisplay={5}
                      appliedToTheNiche={props.applied}
                      isExternalView={false}
                      loading={loadingBookmarks}
                    />
                  </div>
                </>
              )}
            </section>
          {/* Referral Dialog */}
          <ReferralDialog
            open={showReferralDialog}
            onOpenChange={setShowReferralDialog}
            title="Congrats on Activating Your Profile"
            description="Now that you are part of the network, we would love for you to refer one a professional contact or friend onto The Niche to expand the network!"
            forceFormMode={true}
          />

          {/* Projects Dialog */}
          <ProjectsDialog
            open={projectsDialog}
            onOpenChange={setProjectsDialog}
            title="Add Projects and Media"
            description="Showcase your work and achievements to your network."
            onProjectAdded={fetchUserProjects}
          />

          {/* Add File Dialog */}
          <AddFileDialog
            open={addFileDialog.open}
            onOpenChange={(open) => setAddFileDialog({ ...addFileDialog, open })}
            fieldType={addFileDialog.fieldType}
            fieldTitle={addFileDialog.fieldTitle}
            allowFile={addFileDialog.allowFile}
            userId={props.id}
            currentCustomLinks={props.custom_links}
            onSave={handleSave}
          />

          {/* Information Dialog - Show when user hasn't applied */}
          {props.applied === false && (
            <InformationDialog
              open={showInformationDialog}
              onOpenChange={setShowInformationDialog}
              title="Curate Your Profile"
              description="You won't have a Niche network until you activate your profile."
            >
              <div className="space-y-4">
                <p className="text-neutral-200">
                  To unlock this platform, finish these two steps:
                </p>
                <ol className="list-decimal list-inside space-y-3 text-neutral-200">
                  <li>
                    <span className="font-medium">Fill in your profile</span> and activate it.
                  </li>
                  <li>
                    <span className="font-medium">Start exploring</span> - browse opportunities and curate your verified professional network to unlock warm introductions.
                  </li>
                </ol>
                <p className="text-sm text-neutral-400">
                  Your profile is your curated professional presence, digitializing the connections that pave your career and surfacing the opportunities that will take you to the next level.
                </p>
              </div>
            </InformationDialog>
          )}
        </Container>
      </div>
    </SidebarLayout>
  );
}
