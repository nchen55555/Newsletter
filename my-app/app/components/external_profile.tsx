import { ProfileData, CompanyWithImageUrl, FeedItem, ReferralWithProfile } from "@/app/types";
import { GitHubProfileAnalysis } from "@/app/types/github-analysis";
import { 
  AvailableTab, 
  CompanyData, 
  ExternalProfileProps,
} from "@/app/types/match-types";
import { ProfileTabsNav } from "./external_profile/tabs_nav";
import { BookmarksTab } from "./external_profile/bookmarks_tab";
import { ThreadsTab } from "./external_profile/threads_tab";
import { ReferralsTab } from "./external_profile/referrals_tab";
import { ProjectsTab } from "./external_profile/projects_tab";
import { ConnectionsTab } from "./external_profile/connections_tab";
import { NetworkSimilarityTab } from "./external_profile/network_similarity_tab";
import { ScoresTab } from "./external_profile/github_tab";
import { TimelineTab } from "./external_profile/timeline_tab";
import { getClientConfig } from "@/app/components/client-config";

import { Button } from "@/components/ui/button";
import { FileText, Linkedin, Globe, Edit, AlertCircle, Github } from "lucide-react";
import { useEffect, useState, useCallback } from 'react';
import ProfileAvatar from "./profile_avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { encodeSimple } from "../utils/simple-hash";
import { ReferralDialog } from "./referral-dialog";
import { ProjectsDialog } from "./projects_dialog";
import { ProfileFormState } from "../types";
import ProfileInfo from "./profile_info";
import type { RepositoryEmbedding } from "./external_profile/repository_card";

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

type NetworkProfile = ProfileData & {
  networkSimilarity: number;
  networkSimilarityLevel: "very_high" | "high" | "medium" | "low";
};


export function ExternalProfile(props: ExternalProfileProps) {
  const router = useRouter();

  // ---------- Basic profile / config ----------

  const githubAnalysis: GitHubProfileAnalysis | null = (() => {
    try {
      if (typeof props.github_url_data === 'string') {
        return JSON.parse(props.github_url_data);
      }
      return props.github_url_data || null;
    } catch {
      return null;
    }
  })();

  const [isCompanyView, setIsCompanyView] = useState(false);
  const clientConfig = getClientConfig(props.client_id, isCompanyView);

  // ---------- Bookmarks / content sections ----------

  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const [userThreads, setUserThreads] = useState<FeedItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);

  const [userReferrals, setUserReferrals] = useState<ReferralWithProfile[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  const [connectionProfiles, setConnectionProfiles] = useState<ProfileData[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const [userNetwork, setUserNetwork] = useState<NetworkProfile[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string>("");

  const [userProjects, setUserProjects] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsDialog, setProjectsDialog] = useState(false);

  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<AvailableTab>('bookmarks');

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

// Cache company metadata so we don’t keep calling the same endpoint
const [companyData, setCompanyData] = useState<CompanyData | null>(null);


  // ---------- Repository / GitHub similarity ----------

  const [similarDevelopers, setSimilarDevelopers] = useState<SimilarDeveloper[]>([]);
  const [loadingSimilarDevelopers, setLoadingSimilarDevelopers] = useState(false);
  const [similarDevelopersError, setSimilarDevelopersError] = useState<string>('');

  // raw repo objects as returned from /api/repository-similarity
  const [repositoryEmbeddings, setRepositoryEmbeddings] = useState<RepositoryEmbedding[]>([]);

  interface GitHubSimilarityAnalysisResult {
    composite_success_score: number;
    pca_pattern_match?: {
      overall_score: number;
      variance_explained?: number[];
    };
    signature_dimension_match?: {
      weighted_match: number;
    };
    range_compatibility?: {
      dimensions_in_range: number;
      total_dimensions_checked: number;
    };
    shared_cluster_match?: {
      shared_cluster: boolean;
    };
  }

  // High-level GitHub success pattern analysis from /api/github-similarity
  const [githubSimilarityAnalysis, setGithubSimilarityAnalysis] = useState<GitHubSimilarityAnalysisResult | null>(null);

  // If you later add company_repository_skills, you can add:
  // const [repositoryCompanyCompatibility, setRepositoryCompanyCompatibility] = useState<YourType | null>(null);

  // ---------- Edit state ----------

  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<ProfileFormState>({
    id: props.id,
    email: props.email,
    first_name: props.first_name || "",
    last_name: props.last_name || "",
    school: props.school || "",
    linkedin_url: props.linkedin_url || "",
    resume_url: props.resume_url || "",
    personal_website: props.personal_website || "",
    phone_number: props.phone_number || "",
    resume_file: null,
    profile_image_url: props.profile_image_url || null,
    profile_image: null,
    bio: props.bio || "",
    is_public_profile: props.is_public_profile || false,
    newsletter_opt_in: props.newsletter_opt_in || false,
    status: props.status || "",
    transcript_file: null,
    transcript_url: props.transcript_url || "",
    parsed_resume_json: "",
    needs_visa_sponsorship: props.needs_visa_sponsorship || false,
    interests: props.interests || "",
    network_recommendations: props.network_recommendations || [],
    verified: props.verified || false,
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editFormLoading, setEditFormLoading] = useState(false);

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

  const fetchUserThreads = useCallback(async () => {
    // Simple cache: if we've already loaded threads, skip refetch
    if (userThreads.length > 0) {
      return;
    }

    setLoadingThreads(true);
    try {
      const response = await fetch(`/api/get_user_threads?user_id=${props.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const threads = await response.json();
        setUserThreads(threads);
      } else {
        setUserThreads([]);
      }
    } catch (error) {
      console.log("Error fetching user threads", error);
      setUserThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [props.id, userThreads.length]);

  const fetchUserReferrals = useCallback(async () => {
    // Simple cache: if we've already loaded referrals, skip refetch
    if (userReferrals.length > 0) {
      return;
    }

    setLoadingReferrals(true);
    try {
      const response = await fetch(`/api/get_user_referrals?user_id=${props.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const referrals = await response.json();
        setUserReferrals(referrals);
      } else {
        setUserReferrals([]);
      }
    } catch (error) {
      console.log("Error fetching user referrals", error);
      setUserReferrals([]);
    } finally {
      setLoadingReferrals(false);
    }
  }, [props.id, userReferrals.length]);

  const fetchConnectionProfiles = useCallback(async () => {
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
            return { ...profile, connectionRating: connection.rating };
          }
          return null;
        } catch (error) {
          console.log("Error fetching connection profile", error);
          return null;
        }
      });

      const profiles = await Promise.all(profilePromises);
      setConnectionProfiles(
        profiles.filter((p) => p !== null) as ProfileData[]
      );
    } catch (error) {
      console.log("Error fetching connection profiles", error);
      setConnectionProfiles([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [props.connections_new, connectionProfiles.length, connectionProfiles]);

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


// Ensure we have company metadata (cached)
const ensureCompanyMetadata = useCallback(async (): Promise<{
  isCompanyView: boolean;
  company: CompanyData | null;
}> => {
  // If we already have it, just reuse
  if (companyData) {
    setIsCompanyView(true);
    return { isCompanyView: true, company: companyData };
  }

  setIsCompanyView(false);

  if (!props.client_id) {
    return { isCompanyView: false, company: null };
  }

  // setLoadingCompatibility(true);
  try {
    const response = await fetch(`/api/get_company_skills?client_id=${props.client_id}`, {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setIsCompanyView(true);
        setCompanyData(data.company as CompanyData);
        return { isCompanyView: true, company: data.company as CompanyData };
      }
    }

    return { isCompanyView: false, company: null };
  } catch (error) {
    console.error("Error fetching company metadata", error);
    return { isCompanyView: false, company: null };
  }
}, [props.client_id, companyData]);

useEffect(() => {
  if (!props.client_id) return;
  if (companyData) return;          // already loaded

  void ensureCompanyMetadata();
}, [props.client_id, companyData, ensureCompanyMetadata]);

// Build reference profiles from match_profiles + candidate matches
// const buildReferenceProfiles = (
//   matchProfiles: string[],
//   matches: (CandidateMatch | MatchingCandidate)[]
// ): ReferenceProfile[] => {
//   return matchProfiles
//     .map((profileId: string) => {
//       const mc = matches.find(
//         (candidate: any) => candidate.candidate_id?.toString() === profileId.toString()
//       );
//       if (!mc || !mc.skills) return null;

//       return {
//         systems_infrastructure: mc.skills.systems_infrastructure,
//         theory_statistics_ml: mc.skills.theory_statistics_ml,
//         product: mc.skills.product,
//       } as ReferenceProfile;
//     })
//     .filter((p): p is ReferenceProfile => p !== null);
// };

// const skillsPayload = (skills: SkillScores) => {
//   const academicSkills = getAcademicSkills();

//   const hasAcademicSkills =
//       academicSkills && Object.values(academicSkills).some((value) => value > 0);

//   const hasRepoEmbeddings =
//       Array.isArray(repositoryEmbeddings) && repositoryEmbeddings.length > 0;

//   const repositoryEmbeddingsPayload = repositoryEmbeddings
//     .map((repo: any) => repo?.embedding)
//     .filter((emb: any) => Array.isArray(emb) && emb.length > 0);

//   if (hasAcademicSkills && hasRepoEmbeddings) {
//     return {
//       ...academicSkills,
//       repository_embeddings: repositoryEmbeddingsPayload,
//     };
//   } else if (hasAcademicSkills) {
//     return {... academicSkills};
//   } else if (hasRepoEmbeddings) {
//     return {
//       repository_embeddings: repositoryEmbeddingsPayload,
//     };
//   }
//   return null;
// }

// // Shared fetch for “similar candidates + hydrate profiles” given skills + repo embeddings
// const fetchSimilarCandidatesFromModel = useCallback(
//   async ({
//     skills,
//     repoEmbeddings,
//     weights,
//   }: {
//     skills: SkillScores | null;
//     repoEmbeddings: any[] | null;
//     weights: SimilarityWeights;
//   }) => {

//     const hasRepoEmbeddings =
//       Array.isArray(repoEmbeddings) && repoEmbeddings.length > 0;

//     const hasAcademicSkills =
//       skills && Object.values(skills).some((value) => value > 0);


//     const body: any = {
//       candidate_id: props.id.toString(),
//       top_k: 50,
//       weights: similarityWeightsPayload(weights),
//       add_to_model: false,
//       ...skillsPayload(skills as SkillScores)
//     };


//     console.log("BODY IN EXTERNAL PROFILE ", body)

//     const response = await fetch('/api/find_similar_candidates', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify(body),
//     });

//     if (!response.ok) return null;

//     const data = await response.json();
//     if (!data.success || !data.matches || data.matches.length === 0) return null;

//     const matchesResponse = await fetch('/api/get_candidate_matches', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify({ matches: data.matches }),
//     });

//     if (!matchesResponse.ok) return null;
//     const matchesData = await matchesResponse.json();
//     if (!matchesData.success) return null;

//     return matchesData.matches as CandidateMatch[];
//   },
//   [props.id, githubAnalysis, loadingSimilarDevelopers]
// );

// // ---------- Combined similarity (academic + portfolio) + company compatibility ----------

// const runCompanyAndSimilar = useCallback(async () => {
//   const academicSkills = getAcademicSkills();
//   if (!props.client_id || !academicSkills) return;

//    // If we expect GitHub data, wait until repository embeddings have finished loading
//    const expectsRepos = githubAnalysis && Object.keys(githubAnalysis).length > 0;
//    if (expectsRepos && loadingSimilarDevelopers) {
//      // Defer similarity calculation until repository embeddings are ready
//      return;
//    }

//   // 1) Ensure we know whether this is a company view + get company metadata
//   const { isCompanyView: isCompany, company } = await ensureCompanyMetadata();

//   // 2) Candidate similarity (combined / academic / portfolio based on available data)
//   try {
//     const matches = await fetchSimilarCandidatesFromModel({
//       skills: academicSkills,
//       repoEmbeddings: repositoryEmbeddings,
//       weights: similarityWeights,
//     });
//     if (!matches || matches.length === 0) return;

//     setSimilarCandidatesFromPipeline(matches);

//     // 3) Academic company similarity (no GitHub)
//     if (!isCompany || !company) return;

//     const matchProfiles = company.match_profiles;
//     if (!matchProfiles || matchProfiles.length === 0) return;

//     const referenceProfiles = buildReferenceProfiles(matchProfiles, matches);
//     if (referenceProfiles.length === 0) return;

//     const companyCompatResponse = await fetch('/api/company-similarity', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//       body: JSON.stringify({
//         candidate_skills: candidateSkillsForCompany,
//         reference_profiles: referenceProfiles,
//         weights: similarityWeightsPayload(companySimilarityWeights),
//       }),
//     });

//     if (!companyCompatResponse.ok) return;
//     const compatData = await companyCompatResponse.json();
//     if (!compatData.success) return;

//     setCalculatedCompanyCompatibility({
//       company,
//       compatibility: compatData.compatibility,
//     });

//     // Initialize company weights once with cluster_weights (if present)
//     const clusterWeights = compatData.compatibility?.cluster_stats?.cluster_weights;
//     if (clusterWeights && !hasInitializedCompanySimilarityWeights) {
//       setCompanySimilarityWeights((prev: SimilarityWeights) => ({
//         ...prev,
//         systems_infrastructure:
//           clusterWeights.systems_infrastructure ?? prev.systems_infrastructure,
//         theory_statistics_ml:
//           clusterWeights.theory_statistics_ml ?? prev.theory_statistics_ml,
//         product: clusterWeights.product ?? prev.product,
//       }));
//       setHasInitializedCompanySimilarityWeights(true);
//     }
//   } catch (err) {
//     console.error("Error in combined similarity pipeline", err);
//   }
// }, [
//   props.client_id,
//   getAcademicSkills,
//   ensureCompanyMetadata,
//   fetchSimilarCandidatesFromModel,
//   similarityWeights,
//   companySimilarityWeights,
//   hasInitializedCompanySimilarityWeights,
//   githubAnalysis,
//   loadingSimilarDevelopers,
// ]);

// const handleManualRecalc = useCallback(async () => {
//   if (manualRecalcLoading) return;
//   setManualRecalcLoading(true);
//   try {
//     await runCompanyAndSimilar();
//   } finally {
//     setManualRecalcLoading(false);
//   }
// }, [manualRecalcLoading, runCompanyAndSimilar]);


  // ---------- Repository / GitHub similarity pipeline ----------

  const fetchGithub = useCallback(async () => {
    // Simple cache: if we've already loaded repository embeddings, skip refetch
    if (repositoryEmbeddings.length > 0 || similarDevelopers.length > 0) {
      return;
    }

    setLoadingSimilarDevelopers(true);
    setSimilarDevelopersError('');
    
    try {
      const response = await fetch('/api/repository-similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          querySubscriberId: props.id,
          topK: 5,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setSimilarDevelopersError(result.error || 'Failed to fetch similar developers');
        return;
      }

      if (result.success) {
        const enhancedDevelopers: SimilarDeveloper[] = (result.matches as SimilarDeveloper[]).map(
          (match) => ({
          ...match,
          contributionSummary: githubAnalysis?.contributionSummary,
          }),
        );
        setSimilarDevelopers(enhancedDevelopers);

        // This includes repo names, techs, assessments, and embeddings.
        if (result.queryUserRepositories) {
          setRepositoryEmbeddings(result.queryUserRepositories);

          // If we have a company with match_profiles, treat those profile IDs
          // as the "ideal employees". We only send IDs here; the API route
          // will look up their embeddings from github_repository_embeddings.
          if (companyData?.match_profiles && companyData.match_profiles.length > 0) {
            const matchProfileIds = companyData.match_profiles as (string | number)[];

            console.log("<< MATCH PROFILE IDS", matchProfileIds);

            console.log("<< RESULT.QUERYUSERREPOSITORIES", result.queryUserRepositories);

            const candidateEmbeddings = result.queryUserRepositories
              .map((r: RepositoryEmbedding) => {
                const e = r.embedding;
                if (Array.isArray(e)) return e;
                if (typeof e === 'string') {
                  try {
                    const parsed = JSON.parse(e) as unknown;
                    return Array.isArray(parsed) ? (parsed as number[]) : null;
                  } catch {
                    return null;
                  }
                }
                return null;
              })
              .filter((e: number[] | null): e is number[] => Array.isArray(e) && e.length > 0);

            console.log("<< CANDIDATE EMBEDDINGS", candidateEmbeddings);

            if (candidateEmbeddings.length > 0) {
              console.log("FETCHING GITHUB SIMILARITY", matchProfileIds, candidateEmbeddings);
              const res = await fetch('/api/github-similarity', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ideal_profile_ids: matchProfileIds,
                  candidate_embeddings: candidateEmbeddings,
                })
              });
              const data: { success?: boolean; analysis?: GitHubSimilarityAnalysisResult } =
                await res.json();
              console.log('<< GitHub similarity analysis', data);
              if (data?.success && data.analysis) {
                setGithubSimilarityAnalysis(data.analysis);
              } else {
                setGithubSimilarityAnalysis(null);
              }
            }
          }
        }
      } else {
        setSimilarDevelopersError(result.error || 'Failed to fetch similar developers');
      }
    } catch (error) {
      setSimilarDevelopersError(
        `Network error occurred while fetching similar developers: ${String(error)}`
      );
    } finally {
      setLoadingSimilarDevelopers(false);
    }
  }, [props.id, githubAnalysis, repositoryEmbeddings.length, similarDevelopers.length, companyData]);

  // ---------- Network similarity pipeline ----------

  const fetchNetworkSimilarity = useCallback(async () => {
    if (!props.id) return;

    // Simple cache: if we've already loaded the network for this profile, skip refetch
    if (userNetwork.length > 0) {
      return;
    }

    setLoadingNetwork(true);
    setNetworkError("");

    try {
      const response = await fetch("/api/network-similarity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          candidate_id: props.id,
          min_similarity: 0.85,
          top_k: 10,
          exclude_existing: false,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setNetworkError(data.error || "Failed to fetch network similarity");
        setUserNetwork([]);
        return;
      }

      const similarCandidates = (data.similar_candidates || []) as {
        candidate_id: number;
        similarity: number;
      }[];

      if (!Array.isArray(similarCandidates) || similarCandidates.length === 0) {
        setUserNetwork([]);
        return;
      }

      const profilePromises = similarCandidates.map(async (match) => {
        try {
          const encodedId = encodeSimple(match.candidate_id);
          const res = await fetch(`/api/get_external_profile?id=${encodedId}`, {
            credentials: "include",
          });
          if (!res.ok) return null;
          const profile = await res.json();
          return {
            ...(profile as ProfileData),
            networkSimilarity: match.similarity,
          } as NetworkProfile;
        } catch (error) {
          console.log("Error fetching network profile", error);
          return null;
        }
      });

      const profiles = await Promise.all(profilePromises);
      const validProfiles = profiles.filter((p): p is NetworkProfile => p !== null);

      // Sort by similarity descending
      validProfiles.sort((a, b) => b.networkSimilarity - a.networkSimilarity);

      setUserNetwork(validProfiles);
    } catch (error) {
      console.log("Error fetching network similarity", error);
      setNetworkError(`Network error occurred while fetching network similarity: ${String(error)}`);
      setUserNetwork([]);
    } finally {
      setLoadingNetwork(false);
    }
  }, [props.id, userNetwork.length]);


  useEffect(() => {
    const availableTabs: AvailableTab[] = [];
    if (clientConfig.showSkillScores) availableTabs.push('scores');
    if (clientConfig.showBookmarks) availableTabs.push('bookmarks');
    if (clientConfig.showThreads) availableTabs.push('threads');
    if (clientConfig.showReferrals) availableTabs.push('referrals');
    if (clientConfig.showProjects) availableTabs.push('projects');
    if (clientConfig.showConnections) availableTabs.push('connections');
    if (clientConfig.showTimeline) availableTabs.push('timeline');
    if (clientConfig.showNetworkSimilarity) availableTabs.push('network');
    // if (isCompanyView) availableTabs.push('similar');

    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, clientConfig, isCompanyView]);

  // // Dimensions available for similarity weighting (per-dimension gating)
  // const availableSimilarityDimensions: WeightDimension[] = useMemo(() => {
  //   const dims: WeightDimension[] = [];
  //   if ((calculatedSkillScores?.systems_infrastructure ?? 0) > 0) {
  //     dims.push('systems_infrastructure');
  //   }
  //   if ((calculatedSkillScores?.theory_statistics_ml ?? 0) > 0) {
  //     dims.push('theory_statistics_ml');
  //   }
  //   if ((calculatedSkillScores?.product ?? 0) > 0) {
  //     dims.push('product');
  //   }
  //   if (repositoryEmbeddings.length > 0) {
  //     dims.push('repository_similarity');
  //   }
  //   return dims;
  // }, [calculatedSkillScores, repositoryEmbeddings.length]);

  // ---------- Initial load: basic content ----------

  useEffect(() => {
    fetchBookmarkedCompanies();
    fetchUserThreads();
    fetchUserReferrals();
    fetchUserProjects();
  }, [
    props.bookmarked_companies,
    props.company_recommendations,
    props.id,
    fetchBookmarkedCompanies,
    fetchUserThreads,
    fetchUserReferrals,
    fetchUserProjects,
  ]);

  // ---------- Initial load: GitHub similarity ----------

  useEffect(() => {
    if (!githubAnalysis || Object.keys(githubAnalysis).length === 0) return;
    fetchGithub();
  }, [githubAnalysis, fetchGithub]);

  // ---------- Initial load: combined academic + portfolio similarity ----------

  // useEffect(() => {
  //   if (skillsLoading) return;
  //   runCompanyAndSimilar();
  // }, [skillsLoading, runCompanyAndSimilar]);

  // Lazily load connection profiles only when the "connections" tab is active
  useEffect(() => {
    if (activeTab !== 'connections') return;
    if (loadingConnections) return;
    fetchConnectionProfiles();
  }, [activeTab, loadingConnections, fetchConnectionProfiles]);

  // Lazily load network similarity only when the "network" tab is active
  useEffect(() => {
    if (activeTab !== 'network') return;
    if (loadingNetwork) return;
    fetchNetworkSimilarity();
  }, [activeTab, loadingNetwork, fetchNetworkSimilarity]);

  // ---------- Edit form submit ----------

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setEditFormLoading(true);

    try {
      if (!editForm.first_name) {
        setEditFormError("First name is required.");
        return;
      }
      if (!editForm.last_name) {
        setEditFormError("Last name is required.");
        return;
      }
      if (!editForm.phone_number) {
        setEditFormError("Phone number is required.");
        return;
      }
      if (!editForm.linkedin_url) {
        setEditFormError("LinkedIn URL is required.");
        return;
      }
      if (!editForm.bio) {
        setEditFormError("Bio is required.");
        return;
      }
      if (!editForm.school) {
        setEditFormError("School is required.");
        return;
      }

      const formData = new FormData();
      formData.append('id', editForm.id.toString());
      formData.append('first_name', editForm.first_name);
      formData.append('last_name', editForm.last_name);
      formData.append('linkedin_url', editForm.linkedin_url);
      formData.append('personal_website', editForm.personal_website);
      formData.append('phone_number', editForm.phone_number);
      formData.append('email', editForm.email);
      formData.append('bio', editForm.bio);
      formData.append('is_public_profile', editForm.is_public_profile.toString());
      formData.append('newsletter_opt_in', editForm.newsletter_opt_in.toString());
      formData.append('needs_visa_sponsorship', editForm.needs_visa_sponsorship.toString());
      formData.append('school', editForm.school);
      
      if (editForm.resume_file) {
        formData.append('resume_file', editForm.resume_file);
      }
      if (editForm.profile_image) {
        formData.append('profile_image', editForm.profile_image);
      }
      if (editForm.transcript_file) {
        formData.append('transcript_file', editForm.transcript_file);
      }

      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        setIsEditMode(false);
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setEditFormError(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch {
      setEditFormError('An unexpected error occurred.');
    } finally {
      setEditFormLoading(false);
    }
  };

  if (!props) return <Skeleton className="h-12 w-full" />;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Edit mode form */}
        {!props.isExternalView && isEditMode && (
          <form onSubmit={handleEditFormSubmit} className="mb-10 space-y-4">
            {editFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {editFormError}
              </div>
            )}
            <ProfileInfo form={editForm} setForm={setEditForm} />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editFormLoading}>
                {editFormLoading ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        )}

        {/* Read-only header and content */}
        {!isEditMode && (
          <>
      <div className="mb-12">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
              {props.first_name} {props.last_name}
            </h1>
            <div className="text-base text-neutral-600 space-y-1">
              <div>
                {props.status}
                {props.is_public_profile && "Public Profile"}
                {props.newsletter_opt_in && " · Newsletter Opt-in"}
                {props.needs_visa_sponsorship !== undefined && (
                  <span>
                    {(props.is_public_profile || props.newsletter_opt_in) && " · "}
                          {props.needs_visa_sponsorship
                            ? "Needs Visa Sponsorship"
                            : "No Visa Sponsorship Needed"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {!props.isExternalView && (
              <Button
                onClick={() => setIsEditMode(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
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
                </div>
                
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                    {props.bio || 'No bio added yet.'}
                  </div>
                </div>
              </div>

              {/* Interests Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-neutral-900">Interests</h3>
                    {!props.isExternalView && (!props.interests || props.interests.trim() === '') && (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
                
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                    {props.interests || 'No interests added yet.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links and Documents */}
          {(props.linkedin_url || props.personal_website || githubAnalysis?.username || (clientConfig.showTranscript && props.transcript_url) || (clientConfig.showResume && props.resume_url)) && (
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
              {githubAnalysis?.username && (
                <Button asChild variant="outline" size="sm">
                  <a href={`https://github.com/${githubAnalysis.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
              {clientConfig.showTranscript && props.transcript_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.transcript_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Transcript
                  </a>
                </Button>
              )}
              {clientConfig.showResume && props.resume_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={props.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Resume
                  </a>
                </Button>
              )}
            </div>
          )}
          </section>
          </>
        )}


      <div className="w-full mt-8 mb-8">
        <ProfileTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          clientConfig={clientConfig}
          counts={{
            bookmarks: bookmarkedCompanies.length,
            threads: userThreads.length,
            referrals: userReferrals.length,
            projects: userProjects.length,
            connections: connectionProfiles.length,
            network: userNetwork.length,
          }}
          isExternalView={props.isExternalView}
          firstName={props.first_name}
        />

        <div className="space-y-6">
          {activeTab === 'bookmarks' && clientConfig.showBookmarks && (
            <BookmarksTab
              isExternalView={props.isExternalView}
              firstName={props.first_name}
              bookmarkedCompanies={bookmarkedCompanies}
              loadingBookmarks={loadingBookmarks}
            />
          )}

          {activeTab === 'threads' && clientConfig.showThreads && (
            <ThreadsTab
              isExternalView={props.isExternalView}
              firstName={props.first_name}
              userThreads={userThreads}
              loadingThreads={loadingThreads}
            />
          )}

          {activeTab === 'referrals' && clientConfig.showReferrals && (
            <ReferralsTab
              isExternalView={props.isExternalView}
              firstName={props.first_name}
              userReferrals={userReferrals}
              loadingReferrals={loadingReferrals}
              router={router}
            />
          )}

          {activeTab === 'projects' && clientConfig.showProjects && (
            <ProjectsTab
              isExternalView={props.isExternalView}
              userProjects={userProjects}
              loadingProjects={loadingProjects}
              onOpenProjectsDialog={() => setProjectsDialog(true)}
              onProjectDeleted={handleProjectDeleted}
            />
          )}

          {activeTab === 'connections' && clientConfig.showConnections && (
            <ConnectionsTab
              isExternalView={props.isExternalView}
              firstName={props.first_name}
              connectionProfiles={connectionProfiles}
              loadingConnections={loadingConnections}
              router={router}
            />
          )}

          {/* {activeTab === 'similar' && isCompanyView && (
            <SimilarCandidatesTab
              isCompanyView={isCompanyView}
              props={props}
              similarCandidatesFromPipeline={similarCandidatesFromPipeline}
              similarityWeights={similarityWeights}
              setSimilarityWeights={setSimilarityWeights}
              availableSimilarityDimensions={availableSimilarityDimensions}
              loadingCompatibility={loadingCompatibility}
              companyCompatibility={calculatedCompanyCompatibility}
              companySimilarityWeights={companySimilarityWeights}
              setCompanySimilarityWeights={setCompanySimilarityWeights}
              isRecalculating={manualRecalcLoading}
              onRecalculate={handleManualRecalc}
              isCompanyRecalculating={companyRecalcLoading}
              onCompanyRecalculate={handleCompanyCompatibilityRecalc}
            />
          )} */}

          {activeTab === 'scores' && clientConfig.showSkillScores && (
            <ScoresTab
              repositoryEmbeddings={repositoryEmbeddings}
              githubAnalysis={githubAnalysis}
              githubSimilarityAnalysis={githubSimilarityAnalysis}
              clientId={props.client_id}
              similarDevelopers={similarDevelopers}
              loadingSimilarDevelopers={loadingSimilarDevelopers}
              similarDevelopersError={similarDevelopersError}
              fetchSimilarDevelopers={fetchGithub}
            />
          )}

        {activeTab === 'network' && clientConfig.showNetworkSimilarity && (
            <NetworkSimilarityTab
              isExternalView={props.isExternalView}
              firstName={props.first_name}
              userNetwork={userNetwork}
              loadingNetwork={loadingNetwork}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab
              check_in_status={props.check_in_status}
              timeline_of_search={props.timeline_of_search}
              outreach_frequency={props.outreach_frequency}
              isExternalView={props.isExternalView}
            />
          )}
        </div>
      </div>
      
      {/* Referral Dialog - Only show for own profile */}
      {!props.isExternalView && (
        <ReferralDialog 
          open={showReferralDialog} 
          onOpenChange={setShowReferralDialog}
          title="Refer Someone to The Niche"
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
    </>
  );
}