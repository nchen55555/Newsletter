import { ProfileData, CompanyWithImageUrl } from "@/app/types";
import { 
  ExternalProfileProps,
} from "@/app/types/match-types";
import { Button } from "@/components/ui/button";
import { FileText, Linkedin, Globe, Github } from "lucide-react";
import { Container } from './container'
import { SidebarLayout } from "@/app/components/sidebar-layout";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState, useCallback } from 'react';
import ProfileAvatar from "./profile_avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { encodeSimple } from "../utils/simple-hash";
import { UserCheckInComponent, UserStatus } from "./user_check_in_component";
import { NetworkConnectionsGrid } from "./network-connections-grid";
import { BookmarkedCompaniesGrid } from "./bookmarked-companies-grid";
import { ConnectDialog, type ConnectVerificationStatus, type ConnectionStatus } from "./connect_dialog";
import { VerificationRequired } from "./verification-required";
import { ProjectsTab } from "./external_profile/projects_tab";

export interface RepositoryMatch {
  queryRepo: string;
  matchedRepo: string;  
  similarity: number;
}

export interface SimilarDeveloper {
  subscriberId: number;
  totalSimilarity: number;
  matchedRepositories: number;
  repositoryMatches: RepositoryMatch[];
  user: {
    name: string;
    email: string;
    username: string;
    avatar_url?: string | null;
  };
  contributionSummary?: {
    totalActivities: number;
    openSourceContributions: number;
    contributionsByType: {
      push?: number;
      review?: number;
      pull_request?: number;
      create?: number;
      issue?: number;
    };
    activeRepositories: string[];
  };
}



export function ExternalProfile(props: ExternalProfileProps) {
  const router = useRouter();
  const {
    showBio = true,
    showInterests = true,
    showProjects = true,
    showLinks = true,
    showDocuments = true,
    showNetwork = true,
    showCompanies = true,
    showPriorities = true,
  } = props.visibilityResults || {};


  // ---------- Bookmarks / content sections ----------

  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  // const [userThreads, setUserThreads] = useState<FeedItem[]>([]);
  // const [loadingThreads, setLoadingThreads] = useState(false);

  const [connectionProfiles, setConnectionProfiles] = useState<ProfileData[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const [userProjects, setUserProjects] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isSubmittingConnect, setIsSubmittingConnect] = useState(false);
  const [connectVerificationStatus, setConnectVerificationStatus] = useState<ConnectVerificationStatus>('idle');
  const [connectStatusMessage, setConnectStatusMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

   // --- Academic similarity state ---
// const [skillsLoading, setSkillsLoading] = useState(true);

// const [similarityWeights, setSimilarityWeights] = useState<SimilarityWeights>({
//   systems_infrastructure: 1.0,
//   theory_statistics_ml: 1.0,
//   product: 1.0,
//   repository_similarity: 1.0,
// });

// const [companySimilarityWeights, setCompanySimilarityWeights] = useState<SimilarityWeights>({
//   systems_infrastructure: 1.0,
//   theory_statistics_ml: 1.0,
//   product: 1.0,
//   repository_similarity: 1.0,
// });

// const [similarCandidatesFromPipeline, setSimilarCandidatesFromPipeline] = useState<CandidateMatch[]>([]);
// const [loadingCompatibility, setLoadingCompatibility] = useState(false);
// const [manualRecalcLoading, setManualRecalcLoading] = useState(false);
// const [hasInitializedCompanySimilarityWeights, setHasInitializedCompanySimilarityWeights] = useState(false);
// const [companyRecalcLoading, setCompanyRecalcLoading] = useState(false);

// const [calculatedCompanyCompatibility, setCalculatedCompanyCompatibility] = useState<{
//   company: CompanyData;
//   compatibility: CompanyCompatibilityResponse;
// } | null>(null);


  const handleConnectSubmit = async (scaleValue: number, alignmentValue?: number, note?: string) => {
    setIsSubmittingConnect(true);
    setConnectVerificationStatus('idle');

    try {
      const response = await fetch('/api/post_connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connect_id: props.id,
          rating: scaleValue,
          alignment_value: alignmentValue,
          note: note
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.type === 'mutual') {
          setConnectVerificationStatus('success');
          setConnectStatusMessage(`You are now connected with ${props.first_name}! The connection was mutual.`);
        } else {
          setConnectVerificationStatus('success');
          setConnectStatusMessage(`Connection request sent to ${props.first_name}! They've received a notification.`);
        }
      } else {
        setConnectVerificationStatus('error');
        setConnectStatusMessage("Failed to send connection request. Please try again.");
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectVerificationStatus('error');
      setConnectStatusMessage("Failed to send connection request. Please try again.");
    } finally {
      setIsSubmittingConnect(false);
    }
  };

  // ---------- Fetch current user ID ----------

  const [currentUserData, setCurrentUserData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/get_profile', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
          setCurrentUserData(userData);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // ---------- Calculate connection status ----------

  const getConnectionStatus = (): ConnectionStatus => {
    if (!currentUserId) return 'none';

    // Check if current user is in the viewed profile's connections
    if (props.connections_new?.some(conn => conn.connect_id === currentUserId)) {
      return 'connected';
    }

    // Check if the viewed profile sent a request to current user (current user needs to accept)
    if (props.pending_connections_new?.some(conn => conn.connect_id === currentUserId)) {
      return 'requested';
    }

    // Check if current user sent a request to the viewed profile (waiting for acceptance)
    if (props.requested_connections_new?.some(conn => conn.connect_id === currentUserId)) {
      return 'pending_sent';
    }

    return 'none';
  };

  const getExistingConnectionRating = (): number | undefined => {
    if (!currentUserData) return undefined;

    // Find the connection object for the current user
    const connection = currentUserData.connections_new?.find(conn => conn.connect_id === props.id)
    || currentUserData.pending_connections_new?.find(conn => conn.connect_id === props.id);
    return connection?.rating;
  };

  const getExistingAlignmentValue = (): number | undefined => {
    if (!currentUserData) return undefined;

    // Find the connection object for the current user
    const connection = currentUserData.connections_new?.find(conn => conn.connect_id === props.id)
    || currentUserData.pending_connections_new?.find(conn => conn.connect_id === props.id);
    return connection?.alignment_value;
  };

  const getExistingNote = (): string | undefined => {
    if (!currentUserData) return undefined;

    // Find the connection object for the current user
    const connection = currentUserData.connections_new?.find(conn => conn.connect_id === props.id)
    || currentUserData.pending_connections_new?.find(conn => conn.connect_id === props.id);
    console.log("getting note ", connection, currentUserData.pending_connections_new)
    return connection?.note;
  };


  // ---------- Derived helpers ----------

  // Academic skill scores from transcript
  // useEffect(() => {
  //   const calculateScores = async () => {
  //     setSkillsLoading(true);
      
  //     if (!props.parsed_transcript_json) {
  //       setCalculatedSkillScores(null);
  //       setSkillsLoading(false);
  //       return;
  //     }

  //     try {
  //       const transcriptData = typeof props.parsed_transcript_json === 'string' 
  //         ? JSON.parse(props.parsed_transcript_json) 
  //         : props.parsed_transcript_json;

  //       const scores = await calculateSkillScores(transcriptData, props.school);
  //       console.log("scores", scores)
  //       setCalculatedSkillScores(scores);
  //     } catch (error) {
  //       console.log("Error calculating skill scores", error);
  //       setCalculatedSkillScores(null);
  //     }
      
  //     setSkillsLoading(false);
  //   };
    
  //   calculateScores();
  // }, [props.parsed_transcript_json, props.school]);


  // ---------- Fetchers for basic content ----------

  const fetchBookmarkedCompanies = useCallback(async () => {
    if (!props.bookmarked_companies && !props.company_recommendations) {
      setBookmarkedCompanies([]);
      return;
    }

    // Simple cache: if we've already loaded companies, skip refetch
    if (bookmarkedCompanies.length > 0) {
      return;
    }

    setLoadingBookmarks(true);
    try {
      const response = await fetch('/api/companies', {
        credentials: 'include'
      });
      if (response.ok) {
        const allCompanies = await response.json();
        const filteredCompanies = allCompanies.filter((company: CompanyWithImageUrl) =>
          props.bookmarked_companies?.includes(company.company) ||
          props.company_recommendations?.includes(company.company)
        );
        setBookmarkedCompanies(filteredCompanies);
      }
    } catch (error) {
      console.log("Error fetching companies", error);
      setBookmarkedCompanies([]);
    } finally {
      setLoadingBookmarks(false);
    }
  }, [props.bookmarked_companies, props.company_recommendations, bookmarkedCompanies.length]);

  const fetchUserProjects = useCallback(async () => {
    // Simple cache: if we've already loaded projects, skip refetch
    if (userProjects.length > 0) {
      return;
    }

    setLoadingProjects(true);
    try {
      const response = await fetch(`/api/get_user_projects?user_id=${props.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const projects = await response.json();
        setUserProjects(projects.project_urls || []);
      } else {
        setUserProjects([]);
      }
    } catch (error) {
      console.log("Error fetching user projects", error);
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [props.id, userProjects.length]);

  const handleProjectDeleted = (deletedProjectUrl: string) => {
    setUserProjects(prev => prev.filter(url => url !== deletedProjectUrl));
  };

  // const fetchUserThreads = useCallback(async () => {
  //   // Simple cache: if we've already loaded threads, skip refetch
  //   if (userThreads.length > 0) {
  //     return;
  //   }

  //   setLoadingThreads(true);
  //   try {
  //     const response = await fetch(`/api/get_user_threads?user_id=${props.id}`, {
  //       credentials: 'include'
  //     });
  //     if (response.ok) {
  //       const threads = await response.json();
  //       setUserThreads(threads);
  //     } else {
  //       setUserThreads([]);
  //     }
  //   } catch (error) {
  //     console.log("Error fetching user threads", error);
  //     setUserThreads([]);
  //   } finally {
  //     setLoadingThreads(false);
  //   }
  // }, [props.id, userThreads.length]);

  const fetchConnectionProfiles = useCallback(async () => {
    console.log("fetchConnectionProfiles", props.connections_new);
    if (!props.connections_new || props.connections_new.length === 0) {
      setConnectionProfiles([]);
      return;
    }

    // Simple cache: if we've already loaded profiles for these connection IDs, skip refetch
    if (
      connectionProfiles.length > 0 &&
      connectionProfiles.length === props.connections_new.length &&
      props.connections_new.every((c) =>
        connectionProfiles.some((p) => p.id === c.connect_id)
      )
    ) {
      return;
    }

    setLoadingConnections(true);
    try {
      const profilePromises = props.connections_new.map(async (connection) => {
        try {
          const response = await fetch(
            `/api/get_external_profile?id=${encodeSimple(connection.connect_id)}`,
            {
              credentials: "include",
            }
          );
          if (response.ok) {
            const profile = await response.json();
            return { ...profile, connectionRating: connection.rating, connectionNote: connection.note };
          }
          return null;
        } catch (error) {
          console.log("Error fetching connection profile", error);
          return null;
        }
      });

      const profiles = await Promise.all(profilePromises);
      console.log("profiles", profiles);
      setConnectionProfiles(
        profiles.filter((p) => p !== null) as ProfileData[]
      );
    } catch (error) {
      console.log("Error fetching connection profiles", error);
      setConnectionProfiles([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [props.connections_new]);

// Academic skills from transcript → SkillScores (with repo_similarity always 0)
// const getAcademicSkills = useCallback((): SkillScores | null => {
//   if (!calculatedSkillScores) return null;

//   const systems_infrastructure = calculatedSkillScores.systems_infrastructure ?? 0;
//   const theory_statistics_ml = calculatedSkillScores.theory_statistics_ml ?? 0;
//   const product = calculatedSkillScores.product ?? 0;

//   const hasAny = [systems_infrastructure, theory_statistics_ml, product].some(v => v > 0);
//   if (!hasAny) return null;

//   return {
//     systems_infrastructure,
//     theory_statistics_ml,
//     product,
//     repository_similarity: 0,
//   };
// }, [calculatedSkillScores]);


// Short-hand to build weights payload
// const similarityWeightsPayload = (weights: SimilarityWeights) => ({
//   systems_infrastructure: weights.systems_infrastructure,
//   theory_statistics_ml: weights.theory_statistics_ml,
//   product: weights.product,
//   repository_similarity: weights.repository_similarity ?? 1.0,
// });


  useEffect(() => {
    fetchBookmarkedCompanies();
    // fetchUserThreads();
    fetchUserProjects();
  }, [
    props.bookmarked_companies,
    props.company_recommendations,
    props.id,
    fetchBookmarkedCompanies,
    // fetchUserThreads,
    fetchUserProjects,
  ]);

  // ---------- Initial load: combined academic + portfolio similarity ----------

  // useEffect(() => {
  //   if (skillsLoading) return;
  //   runCompanyAndSimilar();
  // }, [skillsLoading, runCompanyAndSimilar]);

  // Lazily load connection profiles only when the "connections" tab is active
  useEffect(() => {
    fetchConnectionProfiles();
  }, [fetchConnectionProfiles]);


  // ---------- Edit form submit ----------

  if (!props) return <Skeleton className="h-12 w-full" />;

  return (
    <SidebarLayout title={`${props.first_name} ${props.last_name}`}>
        <Toaster />
        <div className="pt-12 pb-8 px-6 relative">
          <div className="absolute inset-0 pointer-events-none"></div>
          <Container>
           
      <div className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-200">
                {props.first_name} {props.last_name}
              </h1>
            </div>
            <div className="text-base text-neutral-400 space-y-1">
              <div>
                <span>{props.status}</span>
                {props.is_public_profile && (
                  <span> · Public Profile</span>
                )}
                {props.newsletter_opt_in && (
                  <span> · Newsletter Opt-in</span>
                )}
                {props.needs_visa_sponsorship !== undefined && (
                  <span> · {props.needs_visa_sponsorship ? "Needs Visa Sponsorship" : "No Visa Sponsorship Needed"}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <ConnectDialog
              open={showConnectDialog}
              onOpenChange={setShowConnectDialog}
              firstName={props.first_name}
              isSubmitting={isSubmittingConnect}
              verificationStatus={connectVerificationStatus}
              statusMessage={connectStatusMessage}
              onSubmit={handleConnectSubmit}
              connectionStatus={getConnectionStatus()}
              existingRating={getExistingConnectionRating()}
              existingAlignmentValue={getExistingAlignmentValue()}
              initialNote={getExistingNote()}
              profileImageUrl={props.profile_image_url}
            />
            
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
                editable={false}
                className="w-70 h-70 rounded-full mx-auto lg:mx-0"
              />
            </div>

            {/* User Info, Bio, and Interests - Right Side */}
            <div className="flex-1 space-y-6">
              {/* Connect Button - Only show when viewing someone else's profile
              {props.isExternalView && (
                <Button
                  onClick={() => setShowConnectDialog(true)}
                  className="inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add to Verified Network
                </Button>
              )} */}

              {/* Bio Section */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-200">Bio</h3>
                </div>
                {showBio ? (
                  <div className="rounded-lg p-4">
                    {props.bio && props.bio.trim() !== '' ? (
                      <div className="text-sm text-neutral-400">
                        {props.bio}
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-400">
                        No bio added yet.
                      </div>
                    )}
                  </div>
                ) : (
                  <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
                )}
              </div>

              {/* Interests Section */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-200">Interests</h3>
                </div>
                {showInterests ? (
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
                ) : (
                  <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
                )}
              </div>
            </div>
          </div>

          {/* Links and Documents - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-18 mt-8 mb-8">
            {/* Left Column: Highlighted Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-medium text-neutral-200">Highlighted Media</h3>
              </div>

              {showLinks ? (
                <div className="flex flex-wrap gap-3">
                {/* LinkedIn URL */}
                {props.linkedin_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={props.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}

                {/* Personal Website */}
                {props.personal_website && (
                  <Button asChild variant="outline" size="sm">
                    <a href={props.personal_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Personal Website
                    </a>
                  </Button>
                )}

                {/* Github URL */}
                {props.github_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={props.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <Github className="w-4 h-4 mr-2" />
                      Github URL
                    </a>
                  </Button>
                )}


                {props.custom_links &&
                  Object.entries(JSON.parse(props.custom_links)).map(([key, value]) => {
                    // If value is null/empty skip
                    if (!value || typeof value !== 'string' || value.trim() === '') return null;
                    const label = key
                    const icon = <FileText className="w-4 h-4 mr-2" />
                    return (
                      <Button key={key} asChild variant="outline" size="sm">
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          {icon}
                          {label}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
              )}
            </div>

            {/* Right Column: Highlighted Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-medium text-neutral-200">Highlighted Documents</h3>
              </div>

              {showDocuments ? (

              <div className="flex flex-wrap gap-3">
                {/* Resume */}
                {props.resume_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={props.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Resume
                    </a>
                  </Button>
                )}

                {/* Transcript */}
                {props.transcript_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={props.transcript_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Transcript
                    </a>
                  </Button>
                )}
              </div>
              ) : (
                <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
              )}
            </div>
          </div>


          {/* Priorities Section */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-medium text-neutral-200">
              Professional Priorities and Timelines
            </h3>
          </div>

          {showPriorities ? (
            <UserCheckInComponent
              initialStatus={props.check_in_status as UserStatus}
              initialTimeline={props.timeline_of_search}
              initialOutreachFrequency={props.outreach_frequency}
              isExternalView={true}
            />
          ) : (
            <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
          )}

          {/* Projects Section */}
          <div className="flex items-center justify-between mb-8 mt-8">
            <h3 className="text-lg font-medium text-neutral-200">Projects</h3>
          </div>

          {showProjects ? (
            <ProjectsTab
              isExternalView={true}
              userProjects={userProjects}
              loadingProjects={loadingProjects}
              onOpenProjectsDialog={() => {}}
              onProjectDeleted={handleProjectDeleted}
            />
          ) : (
            <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
          )}

          {/* Network Section */}
          {props.applied && (
            <>
              <div className="flex items-center justify-between mb-8 mt-8">
                <h3 className="text-lg font-medium text-neutral-200">Network</h3>
              </div>

              {showNetwork ? (
                <div className="space-y-4">
                  <NetworkConnectionsGrid
                    connections={connectionProfiles}
                    currentUserData={currentUserData}
                    onSeeAllConnections={() => router.push('/people')}
                    showSeeAll={true}
                    maxDisplay={7}
                    appliedToTheNiche={props.applied}
                    isExternalView={true}
                    loading={loadingConnections}
                  />
                </div>
              ) : (
                <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
              )}
            </>
          )}

          {/* Companies Section */}
          {props.applied && (
            <>
              <div className="flex items-center justify-between mb-8 mt-8">
                <h3 className="text-lg font-medium text-neutral-200">Bookmarked Companies</h3>
              </div>

              {showCompanies ? (
                <div className="space-y-4">
                  <BookmarkedCompaniesGrid
                    companies={bookmarkedCompanies}
                    onSeeAllCompanies={() => router.push('/opportunities')}
                    showSeeAll={true}
                    maxDisplay={5}
                    appliedToTheNiche={props.applied}
                    isExternalView={true}
                    loading={loadingBookmarks}
                  />
                </div>
              ) : (
                <VerificationRequired title="The visibility settings determine whether you can see this section" redirectUrl=""/>
              )}
            </>
          )}


      </section>
      </Container>
      </div>
    </SidebarLayout>
  );
}