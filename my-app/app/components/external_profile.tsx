import { ProfileData, CompanyWithImageUrl, FeedItem, ReferralWithProfile } from "../types";
import { GitHubProfileAnalysis, AnalyzedRepository, TechnologyDetection } from "../types/github-analysis";
import { 
  AvailableTab, 
  CompanyCompatibilityResponse, 
  CompanyData, 
  MatchingCandidate, 
  ReferenceProfile, 
  ExternalProfileProps,
  CandidateMatch,
  SkillScores,
  SimilarityWeights
} from "../types/match-types";
import { Button } from "@/components/ui/button";
import { FileText, Linkedin, Globe, Edit, Plus, Send, Users, AlertCircle, Github } from "lucide-react";
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
import { ProjectsDialog } from "./projects_dialog";
import ApplyCompanies from "./apply-companies";
import SimilarCandidateCard from "./similar_candidate_card";
import { StatusCheckinTriggerButton } from "./status-checkin-context";
import { calculateSkillScores } from "../lib/course-scoring";
import { WeightSliders } from "./weight-sliders";
import ProfileInfo from "./profile_info";
import { ProfileFormState } from "../types";

export function ExternalProfile(props: ExternalProfileProps) {
  const router = useRouter();
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<CompanyWithImageUrl[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  
  // GitHub analysis state
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [githubAnalysis, setGithubAnalysis] = useState<GitHubProfileAnalysis | null>(() => {
    try {
      if (typeof props.github_url_data === 'string') {
        return JSON.parse(props.github_url_data);
      }
      return props.github_url_data || null;
    } catch {
      return null;
    }
  });
  const [loadingGithubAnalysis, setLoadingGithubAnalysis] = useState(false);
  const [githubError, setGithubError] = useState<string>('');

  // Function to analyze GitHub profile
  const analyzeGithubProfile = async () => {
    if (!githubUrl.trim()) {
      setGithubError('Please enter a GitHub URL');
      return;
    }

    // Extract username from GitHub URL
    const githubUsername = githubUrl.replace('https://github.com/', '').replace('http://github.com/', '').split('/')[0];
    
    if (!githubUsername || githubUsername === githubUrl) {
      setGithubError('Please enter a valid GitHub URL (e.g., https://github.com/username)');
      return;
    }

    setLoadingGithubAnalysis(true);
    setGithubError('');
    
    try {
      const response = await fetch('/api/analyze-github-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username: githubUsername,
          id: props.id, 
          store_to_user: true // Store analysis data to user's profile
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setGithubError(result.error || 'Failed to analyze GitHub profile');
        return;
      }

      if (result.success) {
        setGithubAnalysis(result.data);
      } else {
        setGithubError(result.error || 'Failed to analyze GitHub profile');
      }
    } catch (error) {
      setGithubError(`Network error occurred while analyzing profile ${error}`);
    } finally {
      setLoadingGithubAnalysis(false);
    }
  };
  
  // Client-specific configuration
  const getClientConfig = (clientId?: number, isCompany?: boolean) => {
    // If it's a company view, use company-specific config regardless of client_id
    if (isCompany) {
      return {
        title: "Candidate Profile",
        showTranscript: true,
        showResume: true,
        showSkillScores: true,
        showConnections: false,
        showReferrals: false,
        showBookmarks: true,
        showThreads: false,
        showProjects: true,
        showTimeline: true, 
        highlightSections: ['bio', 'projects', 'bookmarks'],
      };
    }
    else{
      return {
          title: "Profile",
          showTranscript: true,
          showResume: true,
          showSkillScores: false,
          showConnections: true,
          showReferrals: true,
          showBookmarks: true,
          showThreads: true,
          showProjects: true,
          showTimeline: true,
          highlightSections: [],
        };
    }

  };
  // Threads state
  const [userThreads, setUserThreads] = useState<FeedItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  
  // Referrals state
  const [userReferrals, setUserReferrals] = useState<ReferralWithProfile[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Connections state
  const [connectionProfiles, setConnectionProfiles] = useState<ProfileData[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Projects state
  const [userProjects, setUserProjects] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsDialog, setProjectsDialog] = useState(false);

  const [loadingCompatibility, setLoadingCompatibility] = useState(false);

  // Check if current client_id is a valid company (determined during compatibility fetch)
  const [isCompanyView, setIsCompanyView] = useState(false);

  const clientConfig = getClientConfig(props.client_id, isCompanyView);

  // Calculate skill scores from parsed_transcript_json
  const [calculatedSkillScores, setCalculatedSkillScores] = useState<SkillScores | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(true);
  
  useEffect(() => {
    const calculateScores = async () => {
      setSkillsLoading(true);
      
      if (!props.parsed_transcript_json) {
        setCalculatedSkillScores(null);
        setSkillsLoading(false);
        return;
      }

      try {
        const transcriptData = typeof props.parsed_transcript_json === 'string' 
          ? JSON.parse(props.parsed_transcript_json) 
          : props.parsed_transcript_json;

        const scores = await calculateSkillScores(transcriptData, props.school);
        setCalculatedSkillScores(scores);
      } catch (error) {
        console.log("Error ", error)
        setCalculatedSkillScores(null);
      }
      
      setSkillsLoading(false);
    };
    
    calculateScores();
  }, [props.parsed_transcript_json, props.school]);


  // Project editing state
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<AvailableTab>('bookmarks');

  // Auto-switch to first available tab if current tab is not available for this client
  useEffect(() => {
    const availableTabs: AvailableTab[] = [];
    if (clientConfig.showSkillScores) availableTabs.push('scores'); // Scores tab for skill evaluation
    if (clientConfig.showBookmarks) availableTabs.push('bookmarks');
    if (clientConfig.showThreads) availableTabs.push('threads');
    if (clientConfig.showReferrals) availableTabs.push('referrals');
    if (clientConfig.showProjects) availableTabs.push('projects');
    if (clientConfig.showConnections) availableTabs.push('connections');
    if (clientConfig.showTimeline) availableTabs.push('timeline');
    if (isCompanyView) availableTabs.push('similar'); // Similar candidates tab for company view
    
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, clientConfig, isCompanyView, calculatedSkillScores]);



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
        setUserProjects([]);
      }
    } catch (error) {
      setUserProjects([]);
      console.log("Error ", error)
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
        setUserThreads([]);
      }
    } catch (error) {
      setUserThreads([]);
      console.log("Error ", error)
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
        setUserReferrals([]);
      }
    } catch (error) {
      setUserReferrals([]);
      console.log("error ", error)
    } finally {
      setLoadingReferrals(false);
    }
  }, [props.id]);

  // Fetch connection profiles
  const fetchConnectionProfiles = useCallback(async () => {
    if (!props.connections_new || props.connections_new.length === 0) {
      setConnectionProfiles([]);
      return;
    }

    setLoadingConnections(true);
    try {
      // Fetch profile data for each connection
      const profilePromises = props.connections_new.map(async (connection) => {
        try {
          const response = await fetch(`/api/get_external_profile?id=${encodeSimple(connection.connect_id)}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const profile = await response.json();
            // Add the rating to the profile for easy access
            return { ...profile, connectionRating: connection.rating };
          }
          return null;
        } catch (error) {
          console.log("Error ", error)
          return null;
        }
      });

      const profiles = await Promise.all(profilePromises);
      setConnectionProfiles(profiles.filter(profile => profile !== null));
    } catch (error) {
      console.log("Error ", error)
      setConnectionProfiles([]);
    } finally {
      setLoadingConnections(false);
    }
  }, [props.connections_new]);

  // Store similar candidates from the main pipeline for company view display
  const [similarCandidatesFromPipeline, setSimilarCandidatesFromPipeline] = useState<CandidateMatch[]>([]);
  
  // Helper function to construct skills object from available data sources
  const getAvailableSkills = useCallback((): SkillScores | null => {
    const skills: SkillScores = {
      systems_infrastructure: 0,
      theory_statistics_ml: 0,
      product: 0,
      github_similarity: 0
    };
    
    let hasAnySkills = false;

    // Add academic skills if available
    if (calculatedSkillScores) {
      if (typeof calculatedSkillScores.systems_infrastructure === 'number') {
        skills.systems_infrastructure = calculatedSkillScores.systems_infrastructure;
        hasAnySkills = true;
      }
      if (typeof calculatedSkillScores.theory_statistics_ml === 'number') {
        skills.theory_statistics_ml = calculatedSkillScores.theory_statistics_ml;
        hasAnySkills = true;
      }
      if (typeof calculatedSkillScores.product === 'number') {
        skills.product = calculatedSkillScores.product;
        hasAnySkills = true;
      }
    }

    // Add GitHub similarity if available (user has GitHub embeddings)
    if (githubAnalysis && props.github_vector_embeddings) {
      // Note: github_similarity for the query user will be set to 1.0 in the API
      // when they have GitHub data (perfect match to themselves)
      skills.github_similarity = 1.0;
      hasAnySkills = true;
    }
    return hasAnySkills ? skills : null;
  }, [calculatedSkillScores, githubAnalysis, props.github_vector_embeddings]);

  // Helper function to determine which dimensions are available for comparison (matches Python backend logic)
  const getAvailableComparisonDimensions = useCallback(() => {
    const availableSkills = getAvailableSkills();
    if (!availableSkills) return [];

    // Determine what type of data the query candidate has (same logic as Python backend)
    const hasSkills = ['systems_infrastructure', 'theory_statistics_ml', 'product'].some(
      dim => (availableSkills[dim as keyof SkillScores] || 0) > 0
    );
    const hasGithub = (availableSkills.github_similarity || 0) > 0;

    if (hasSkills && hasGithub) {
      // Query has both - compare along all 4 dimensions
      return ['systems_infrastructure', 'theory_statistics_ml', 'product', 'github_similarity'];
    } else if (hasSkills) {
      // Query has only skills - compare along skills only
      return ['systems_infrastructure', 'theory_statistics_ml', 'product'];
    } else if (hasGithub) {
      // Query has only github - compare along github only
      return ['github_similarity'];
    } else {
      // Query has no data
      return [];
    }
  }, [getAvailableSkills]);
  
  // Category weights state for similarity matching
  const [categoryWeights, setCategoryWeights] = useState<SimilarityWeights>({
    systems_infrastructure: 1.0,
    theory_statistics_ml: 1.0,
    product: 1.0,
    ...(githubAnalysis && { github_similarity: 1.0 })
  });

  // Category weights state for company compatibility
  const [companyWeights, setCompanyWeights] = useState<SimilarityWeights>({
    systems_infrastructure: 1.0,
    theory_statistics_ml: 1.0,
    product: 1.0,
    ...(githubAnalysis && { github_similarity: 1.0 })
  });
  
  // Flag to prevent infinite loop when setting initial weights
  const [hasInitializedWeights, setHasInitializedWeights] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Edit form state - initialized with current profile data
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
  
  // Note: Company data is fetched fresh and used directly, no state needed

  // Store company compatibility results from API call
  const [calculatedCompanyCompatibility, setCalculatedCompanyCompatibility] = useState<{
    company: CompanyData;
    compatibility: CompanyCompatibilityResponse;
  } | null>(null);

  // Update company weights to match calculated cluster weights when compatibility data loads (only once)
  useEffect(() => {
    
    if (!hasInitializedWeights && calculatedCompanyCompatibility?.compatibility.cluster_stats?.cluster_weights) {
      const clusterWeights = calculatedCompanyCompatibility.compatibility.cluster_stats.cluster_weights;
      setCompanyWeights({
        systems_infrastructure: clusterWeights.systems_infrastructure,
        theory_statistics_ml: clusterWeights.theory_statistics_ml,
        product: clusterWeights.product
      });
      setHasInitializedWeights(true);
    }
  }, [calculatedCompanyCompatibility, hasInitializedWeights]);



  // Fetch company compatibility and detect if this is a company view (single operation)
  const fetchCompanyCompatibility = useCallback(async () => {
    // Reset states
    setIsCompanyView(false);
    
    // Need client_id to check for company
    if (!props.client_id) {
      return;
    }

    setLoadingCompatibility(true);
    try {
      // Try to fetch company data - this will tell us if it's a company view
      const response = await fetch(`/api/get_company_skills?client_id=${props.client_id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // This IS a company view!
          setIsCompanyView(true);
          return { isCompanyView: true, company: data.company };
        }
        setIsCompanyView(false);
        return { isCompanyView: false, company: null };
      }
    }  finally {
      setLoadingCompatibility(false);
    }
  }, [props.client_id]);


  // Run company compatibility check and find similar candidates together to avoid race conditions
    const runCompanyAndSimilar = useCallback(async () => {
      // First, check if this is a company view and get company data
      const compatInfo = await fetchCompanyCompatibility();
      const isCompany: boolean | undefined = compatInfo?.isCompanyView;
      const company: CompanyData = compatInfo?.company;
      
      // Then run find similar candidates if we have client_id and any available skills
      const availableSkills = getAvailableSkills();
      if (props.client_id && availableSkills) {
        try {
        const response = await fetch('/api/find_similar_candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skills: availableSkills,
            candidate_id: props.id.toString(),
            top_k: 50, // Get all candidates to see weight effects
            weights: categoryWeights
          }),
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {

            // Now call get_candidate_matches with the matches we just got
            if (data.matches && data.matches.length > 0) {
              try {
                const matchesResponse = await fetch('/api/get_candidate_matches', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    matches: data.matches
                  }),
                  credentials: 'include'
                });

                if (matchesResponse.ok) {
                  const matchesData = await matchesResponse.json();
                  
                  if (matchesData.success) {
                    
                    // Store the enriched matches for company view display
                    setSimilarCandidatesFromPipeline(matchesData.matches || []);
                    
                    // IMMEDIATELY call company compatibility API if this is a company view
                    if (isCompany && company) {
                      try {
                        // Reuse the SAME availableSkills that worked for similar candidates
                        
                        // Build reference profiles from company data and similar candidates
                        const matchProfiles = company.match_profiles;
                        if (matchProfiles && matchProfiles.length > 0 && availableSkills) {
                          const referenceProfiles = matchProfiles
                            .map((profileId: string) => {
                              const matchingCandidate = matchesData.matches?.find(
                                (candidate: MatchingCandidate) => candidate.candidate_id?.toString() === profileId.toString()
                              );

                              if (matchingCandidate && matchingCandidate.skills) {
                                const profile: ReferenceProfile = {
                                  systems_infrastructure: matchingCandidate.skills.systems_infrastructure,
                                  theory_statistics_ml: matchingCandidate.skills.theory_statistics_ml,
                                  product: matchingCandidate.skills.product
                                };
                                
                                // Include GitHub similarity if available
                                if (matchingCandidate.skills.github_similarity !== undefined) {
                                  profile.github_similarity = matchingCandidate.skills.github_similarity;
                                }
                                
                                // Include GitHub vector embeddings if available
                                if (matchingCandidate.github_vector_embeddings) {
                                  profile.github_vector_embeddings = matchingCandidate.github_vector_embeddings;
                                }
                                
                                return profile;
                              }
                              return null;
                            })
                            .filter(profile => profile !== null);

                          if (referenceProfiles.length > 0) {
                            // Parse candidate's GitHub vector if it's stored as string
                            let candidateVector = props.github_vector_embeddings;
                            if (typeof props.github_vector_embeddings === 'string') {
                              try {
                                candidateVector = JSON.parse(props.github_vector_embeddings);
                              } catch (error) {
                                console.log("Error parsing GitHub vector:", error);
                                candidateVector = undefined;
                              }
                            }

                            // Call company similarity API
                            const companyCompatResponse = await fetch('/api/company-similarity', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                candidate_skills: availableSkills,
                                reference_profiles: referenceProfiles,
                                candidate_github_vector: candidateVector,
                                weights: companyWeights
                              }),
                              credentials: 'include'
                            });

                            if (companyCompatResponse.ok) {
                              const compatData = await companyCompatResponse.json();
                              if (compatData.success && company) {
                                setCalculatedCompanyCompatibility({
                                  company: company,
                                  compatibility: compatData.compatibility
                                });
                              } else {
                                console.error('Company similarity API error:', compatData.error || 'Missing company data');
                              }
                            } else {
                              console.error('Company similarity API failed:', companyCompatResponse.status);
                            }
                          }
                        }
                      } catch (companyError) {
                        console.error('Error calculating company compatibility:', companyError);
                      }
                    }
                  } 
                } 
              } catch (matchesError) {
                console.error('Error calling get_candidate_matches:', matchesError);
              }
            }
          } 
        } 
        } catch (error) {
          console.error('Error running find_similar_candidates:', error);
        }
      }
    }, [fetchCompanyCompatibility, getAvailableSkills, props.client_id, categoryWeights, props.id, companyWeights, props.github_vector_embeddings]);

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

          // Filter companies based on bookmarked company IDs
          const filteredCompanies = allCompanies.filter((company: CompanyWithImageUrl) =>
            props.bookmarked_companies?.includes(company.company) || props.company_recommendations?.includes(company.company)
          );

          setBookmarkedCompanies(filteredCompanies);
        }
      } catch (error) {
        console.log("Error ", error)
        setBookmarkedCompanies([]);
      } finally {
        setLoadingBookmarks(false);
      }
    }, [props.bookmarked_companies, props.company_recommendations]);
  
  // Fetch bookmarked companies and initial data
  useEffect(() => {
    fetchBookmarkedCompanies();
    fetchUserThreads();
    fetchUserReferrals();
    fetchUserProjects();
    fetchConnectionProfiles();

    // Only run company compatibility when skills are fully loaded
    if (!skillsLoading) {
      runCompanyAndSimilar();
    }
  }, [props.bookmarked_companies, props.company_recommendations, props.id, props.client_id, calculatedSkillScores, githubAnalysis, props.github_vector_embeddings, skillsLoading]);
  
  // Separate effect for category weight changes - only recalculate similar candidates
  useEffect(() => {
    // Get available skills for recalculation
    const availableSkills = getAvailableSkills();
    
    // Only run if we have client_id, skills, and we've already loaded initial data
    if (props.client_id && availableSkills && similarCandidatesFromPipeline.length === 0) {
      // Don't run if we haven't loaded initial data yet
      return;
    }
    
    if (props.client_id && availableSkills) {
      // Recalculate similar candidates with new weights
      const recalculateSimilarCandidates = async () => {
        try {
          const response = await fetch('/api/find_similar_candidates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              skills: availableSkills,
              candidate_id: props.id.toString(),
              top_k: 50,
              weights: categoryWeights
            }),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.matches && data.matches.length > 0) {
              // Only update similar candidates, don't refetch profiles
              const matchesResponse = await fetch('/api/get_candidate_matches', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  matches: data.matches
                }),
                credentials: 'include'
              });

              if (matchesResponse.ok) {
                const matchesData = await matchesResponse.json();
                if (matchesData.success) {
                  setSimilarCandidatesFromPipeline(matchesData.matches || []);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error recalculating similar candidates:', error);
        }
      };

      // Debounce the recalculation to avoid too many API calls
      const timeoutId = setTimeout(recalculateSimilarCandidates, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [categoryWeights, getAvailableSkills, props.client_id, props.id, similarCandidatesFromPipeline.length]);

  // Separate effect for company weight changes - recalculate company compatibility
  useEffect(() => {
    // Get available skills for recalculation
    const availableSkills = getAvailableSkills();
    
    // Only run if we have company data, skills, and we've already loaded initial data
    if (!isCompanyView || !calculatedCompanyCompatibility || !hasInitializedWeights) {
      // Don't run if we haven't loaded initial company data yet
      return;
    }
    
    if (availableSkills && similarCandidatesFromPipeline.length > 0) {
      // Recalculate company compatibility with new weights
      const recalculateCompanyCompatibility = async () => {
        try {
          const company = calculatedCompanyCompatibility.company;
          
          // Build reference profiles from company data and similar candidates
          const matchProfiles = company.match_profiles;
          if (matchProfiles && matchProfiles.length > 0) {
            const referenceProfiles = matchProfiles
              .map((profileId: string) => {
                const matchingCandidate = similarCandidatesFromPipeline.find(
                  (candidate: CandidateMatch) => candidate.candidate_id?.toString() === profileId.toString()
                );

                if (matchingCandidate && matchingCandidate.skills) {
                  const profile: ReferenceProfile = {
                    systems_infrastructure: matchingCandidate.skills.systems_infrastructure,
                    theory_statistics_ml: matchingCandidate.skills.theory_statistics_ml,
                    product: matchingCandidate.skills.product
                  };
                  
                  // Include GitHub similarity if available
                  if (matchingCandidate.skills.github_similarity !== undefined) {
                    profile.github_similarity = matchingCandidate.skills.github_similarity;
                  }
                  
                  // Include GitHub vector embeddings if available
                  if (matchingCandidate.github_vector_embeddings) {
                    profile.github_vector_embeddings = matchingCandidate.github_vector_embeddings;
                  }
                  
                  return profile;
                }
                return null;
              })
              .filter(profile => profile !== null);

            if (referenceProfiles.length > 0) {
              // Parse candidate's GitHub vector if it's stored as string
              let candidateVector = props.github_vector_embeddings;
              if (typeof props.github_vector_embeddings === 'string') {
                try {
                  candidateVector = JSON.parse(props.github_vector_embeddings);
                } catch (error) {
                  console.log("Error parsing GitHub vector:", error);
                  candidateVector = undefined;
                }
              }

              // Call company similarity API with updated weights
              const companyCompatResponse = await fetch('/api/company-similarity', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  candidate_skills: availableSkills,
                  reference_profiles: referenceProfiles,
                  candidate_github_vector: candidateVector,
                  weights: companyWeights
                }),
                credentials: 'include'
              });

              if (companyCompatResponse.ok) {
                const compatData = await companyCompatResponse.json();
                if (compatData.success && company) {
                  setCalculatedCompanyCompatibility({
                    company: company,
                    compatibility: compatData.compatibility
                  });
                } else {
                  console.error('Company similarity API error:', compatData.error || 'Missing company data');
                }
              } else {
                console.error('Company similarity API failed:', companyCompatResponse.status);
              }
            }
          }
        } catch (error) {
          console.error('Error recalculating company compatibility:', error);
        }
      };

      // Debounce the recalculation to avoid too many API calls
      const timeoutId = setTimeout(recalculateCompanyCompatibility, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [companyWeights, getAvailableSkills, isCompanyView, calculatedCompanyCompatibility, hasInitializedWeights, similarCandidatesFromPipeline, props.github_vector_embeddings]);
    
    if (!props) return <Skeleton className="h-12 w-full" />; // or customize size;

  // Handle edit form submission
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setEditFormLoading(true);

    try {
      // Validate required fields
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

      // Build form data
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
      
      // Handle file uploads
      if (editForm.resume_file) {
        formData.append('resume_file', editForm.resume_file);
      }
      if (editForm.profile_image) {
        formData.append('profile_image', editForm.profile_image);
      }
      if (editForm.transcript_file) {
        formData.append('transcript_file', editForm.transcript_file);
      }

      // Make request
      const response = await fetch('/api/post_profile', {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        setIsEditMode(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setEditFormError(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      setEditFormError('An unexpected error occurred.');
    } finally {
      setEditFormLoading(false);
    }
  };

  // Show edit form if in edit mode
  if (isEditMode) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Edit Profile</h1>
        </div>
        
        <form onSubmit={handleEditFormSubmit}>
          <ProfileInfo 
            form={editForm} 
            setForm={setEditForm}
          />
          
          {editFormError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{editFormError}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              onClick={() => setIsEditMode(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editFormLoading}
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              {editFormLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
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
                    {props.needs_visa_sponsorship ? "Needs Visa Sponsorship" : "No Visa Sponsorship Needed"}
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


          {/* Profile Alignment - Only show for company view */}
          {isCompanyView && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">
                  Profile Alignment{calculatedCompanyCompatibility?.company?.name ? ` to ${calculatedCompanyCompatibility.company.name}` : ''}
                </h3>
                
                {calculatedCompanyCompatibility && (
                  <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                    {Math.round(calculatedCompanyCompatibility.compatibility.similarity_percentage)}% Match
                  </span>
                )}
              </div>

               <div className="bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-700 whitespace-pre-line">
                    Indexing on candidate profiles that we believe would be successful at {calculatedCompanyCompatibility?.company?.name ? String(calculatedCompanyCompatibility.company.name) : 'your company'}, we determine compatability. 
                  </div>
                </div>
              
              {/* Compatibility Result Display */}
              {loadingCompatibility ? (
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm text-neutral-500">Loading compatibility...</div>
                </div>
              ) : calculatedCompanyCompatibility ? (
                <div>
                  {/* Match Breakdown */}
                  <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-medium text-neutral-700">Match Breakdown</h4>
                    <div className="space-y-3">
                      {[
                        // Only include academic skills if candidate has data for them
                        ...(calculatedCompanyCompatibility.compatibility.skills.systems_infrastructure > 0 ? [{ 
                          key: 'systems_infrastructure', 
                          name: 'Systems & Infrastructure',
                          candidate: calculatedCompanyCompatibility.compatibility.skills.systems_infrastructure || 0,
                          company: calculatedCompanyCompatibility.compatibility.company_requirements.systems_infrastructure || 0,
                          difference: calculatedCompanyCompatibility.compatibility.skill_differences.systems_infrastructure || 0,
                          weight: companyWeights.systems_infrastructure || 0
                        }] : []),
                        ...(calculatedCompanyCompatibility.compatibility.skills.theory_statistics_ml > 0 ? [{ 
                          key: 'theory_statistics_ml', 
                          name: 'Theory & Statistics',
                          candidate: calculatedCompanyCompatibility.compatibility.skills.theory_statistics_ml || 0,
                          company: calculatedCompanyCompatibility.compatibility.company_requirements.theory_statistics_ml || 0,
                          difference: calculatedCompanyCompatibility.compatibility.skill_differences.theory_statistics_ml || 0,
                          weight: companyWeights.theory_statistics_ml || 0
                        }] : []),
                        ...(calculatedCompanyCompatibility.compatibility.skills.product > 0 ? [{ 
                          key: 'product', 
                          name: 'Core Product Engineering',
                          candidate: calculatedCompanyCompatibility.compatibility.skills.product || 0,
                          company: calculatedCompanyCompatibility.compatibility.company_requirements.product || 0,
                          difference: calculatedCompanyCompatibility.compatibility.skill_differences.product || 0,
                          weight: companyWeights.product || 0
                        }] : []),
                        // Include GitHub similarity if available and candidate has GitHub data
                        ...(calculatedCompanyCompatibility.compatibility.skills.github_similarity !== undefined && calculatedCompanyCompatibility.compatibility.skills.github_similarity > 0 ? [{
                          key: 'github_similarity', 
                          name: 'GitHub Technical Similarity',
                          candidate: calculatedCompanyCompatibility.compatibility.skills.github_similarity || 0,
                          company: 0, // Not applicable for GitHub - it's a direct similarity measure
                          difference: calculatedCompanyCompatibility.compatibility.skill_differences.github_similarity || 0,
                          weight: 1.00,
                          isGithub: true // Flag to handle GitHub differently
                        }] : [])
                      ].map((skill) => (
                        <div key={skill.key} className="flex items-center justify-between p-3 bg-neutral-50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-neutral-700">{skill.name}</span>
                              <span className="text-xs text-neutral-500">Weight: {skill.weight.toFixed(2)}x</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-neutral-600">
                              {skill.isGithub ? (
                                <>
                                  <span>Average similarity: {skill.candidate.toFixed(1)}% to company&apos;s requirements</span>
                                </>
                              ) : (
                                <>
                                  <span>You: {skill.candidate.toFixed(1)}</span>
                                  <span>Company Avg: {skill.company.toFixed(1)}</span>
                                  <span className={`font-medium ${skill.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {skill.difference >= 0 ? '+' : ''}{skill.difference.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Company Compatibility Weight Controls */}
                  <WeightSliders
                    title="Adjust Weighted Focus"
                    weights={companyWeights}
                    onWeightChange={(newWeights) => setCompanyWeights(prev => ({ ...prev, ...newWeights }))}
                    availableDimensions={[
                      ...(calculatedCompanyCompatibility.compatibility.skills.systems_infrastructure > 0 ? ['systems_infrastructure'] : []),
                      ...(calculatedCompanyCompatibility.compatibility.skills.theory_statistics_ml > 0 ? ['theory_statistics_ml'] : []),
                      ...(calculatedCompanyCompatibility.compatibility.skills.product > 0 ? ['product'] : []),
                      ...(githubAnalysis ? ['github_similarity'] : [])
                    ]}
                    showCurrentValues={true}
                    resetButtonText="Reset to Calculated"
                    onReset={() => {
                      if (calculatedCompanyCompatibility?.compatibility.cluster_stats?.cluster_weights) {
                        const clusterWeights = calculatedCompanyCompatibility.compatibility.cluster_stats.cluster_weights;
                        setCompanyWeights({
                          systems_infrastructure: clusterWeights.systems_infrastructure,
                          theory_statistics_ml: clusterWeights.theory_statistics_ml,
                          product: clusterWeights.product,
                          github_similarity: clusterWeights.github_similarity || 1.0
                        });
                      } else {
                        setCompanyWeights({
                          systems_infrastructure: 1.0,
                          theory_statistics_ml: 1.0,
                          product: 1.0,
                          ...(githubAnalysis && { github_similarity: 1.0 })
                        });
                      }
                    }}
                  />
                </div>

                
              ) : calculatedSkillScores ? (
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm text-neutral-500">Unable to load company requirements</div>
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="text-sm text-neutral-500">Skill assessment required for compatibility analysis</div>
                </div>
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
                {clientConfig.showBookmarks && (
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
                )}
                {clientConfig.showThreads && (
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
                )}
                {clientConfig.showReferrals && (
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
                )}
                {clientConfig.showProjects && (
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'projects'
                        ? 'border-neutral-900 text-neutral-900'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{props.isExternalView ? `${props.first_name}'s Projects` : 'Your Projects'} ({userProjects.length})</span>
                      {!props.isExternalView && userProjects.length === 0 && (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </button>
                )}
                {clientConfig.showConnections && (
                  <button
                    onClick={() => setActiveTab('connections')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'connections'
                        ? 'border-neutral-900 text-neutral-900'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {props.isExternalView ? `${props.first_name}'s Network` : 'Your Network'} ({connectionProfiles.length})
                  </button>
                )}
                {isCompanyView && (
                  <button
                    onClick={() => setActiveTab('similar')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'similar'
                        ? 'border-neutral-900 text-neutral-900'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    Similar Candidates
                  </button>
                )}
                {clientConfig.showSkillScores && (calculatedSkillScores || githubAnalysis) && (
                  <button
                    onClick={() => setActiveTab('scores')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'scores'
                        ? 'border-neutral-900 text-neutral-900'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    Profile Evaluation
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'timeline'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  Timeline
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Bookmarked Companies Tab */}
              {activeTab === 'bookmarks' && clientConfig.showBookmarks && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Bookmarked and Recommended</h3>
                    {!props.isExternalView && (
                      <ApplyCompanies
                          triggerElement={
                              <Button
                              size="sm"
                              className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Request an Intro to an Opportunity
                          </Button>
                        }
                      />
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
              {activeTab === 'threads' && clientConfig.showThreads && (
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
              {activeTab === 'referrals' && clientConfig.showReferrals && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Your Referrals</h3>
                    {!props.isExternalView && (
                      <Button
                        onClick={() => setShowReferralDialog(true)}
                        size="sm"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Refer Someone to the Niche
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

              {/* User Projects Tab */}
              {activeTab === 'projects' && clientConfig.showProjects && (
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

              {/* Connections Tab */}
              {activeTab === 'connections' && clientConfig.showConnections && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Network Connections</h3>
                  </div>
                  {loadingConnections ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ) : connectionProfiles.length > 0 ? (
                    <div className="space-y-4">
                      {connectionProfiles.map((profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          onClick={() => {
                            if (profile.id) {
                              const encodedId = encodeSimple(profile.id);
                              router.push(`/people/${encodedId}`);
                            }
                          }}
                          connectionStatus="connected"
                          connectionRating={profile.connectionRating}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {props.isExternalView ? `${props.first_name} hasn't connected with anyone yet.` : "You haven't connected with anyone yet."}
                    </div>
                  )}
                </div>
              )}

              {/* Similar Candidates Tab - Only for company view */}
              {activeTab === 'similar' && isCompanyView && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Similarity in Profiles</h3>
                  </div>
                  
                  <WeightSliders
                    title="Adjust Weighted Focus"
                    weights={categoryWeights}
                    onWeightChange={(newWeights) => setCategoryWeights(prev => ({ ...prev, ...newWeights }))}
                    availableDimensions={getAvailableComparisonDimensions()}
                    onReset={() => {
                      const resetWeights: Record<string, number> = {};
                      getAvailableComparisonDimensions().forEach(dim => {
                        resetWeights[dim] = 1.0;
                      });
                      setCategoryWeights(prev => ({ ...prev, ...resetWeights }));
                    }}
                  />
                  {similarCandidatesFromPipeline.length === 0 && props.client_id ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                      <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                  ) : similarCandidatesFromPipeline.length > 0 ? (
                    <div className="space-y-4">
                      {similarCandidatesFromPipeline
                        .filter(match => match.profile?.id !== props.id && match.profile) // Exclude self and ensure profile exists
                        .slice(0, 5).map((match) => (
                        <SimilarCandidateCard
                          key={match.candidate_id}
                          profile={match.profile as ProfileData}
                          onClick={() => {
                            if (match.profile?.id && props.client_id) {
                              const encodedId = encodeSimple(match.profile.id);
                              const clientEncodedId = encodeSimple(props.client_id);
                              router.push(`/external_profile/${encodedId}_${clientEncodedId}`);
                            }
                            else if (match.profile?.id) {
                              const encodedId = encodeSimple(match.profile.id);
                              router.push(`/external_profile/${encodedId}`);
                            }
                          }}
                          similarityPercentage={match.similarity_percentage}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      No similar candidates found.
                    </div>
                  )}
                </div>
              )}

              {/* Class Evaluation Tab - Only show for certain clients */}
              {activeTab === 'scores' && clientConfig.showSkillScores && (calculatedSkillScores || githubAnalysis) && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Class Evaluation</h3>
                  </div>
                  
                  { calculatedSkillScores && (<div className="bg-neutral-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(() => {
                        try {
                          const scores = calculatedSkillScores;
                          return [
                            { name: 'Systems & Infrastructure', score: scores.systems_infrastructure || 0 },
                            { name: 'Theory, Statistics & ML', score: scores.theory_statistics_ml || 0 },
                            { name: 'Product Development', score: scores.product || 0 }
                          ].map((skill) => (
                            <div key={skill.name} className="text-center bg-white rounded-lg p-4">
                              <div className="text-3xl font-bold text-neutral-900 mb-2">{skill.score.toFixed(1)}</div>
                              <div className="text-sm font-medium text-neutral-600">{skill.name}</div>
                            </div>
                          ));
                        } catch {
                          return <div className="text-sm text-neutral-500 col-span-3 text-center">Skill scores not available</div>;
                        }
                      })()} 
                    </div>
                  </div>
                  )}

                  {/* GitHub Profile Analysis Section */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-neutral-900">Technical Project Analysis</h3>
                    </div>
                    
                    <div>
                      {githubAnalysis && (
                        <div className="space-y-6 mb-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-md font-semibold text-neutral-900">Previous GitHub Analysis</h4>
                              {githubAnalysis.analysisDate && (
                                <p className="text-sm text-neutral-500 mt-1">
                                  Analyzed on {new Date(githubAnalysis.analysisDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setGithubAnalysis(null);
                                setGithubUrl('');
                              }}
                              className="text-sm text-neutral-600 hover:text-neutral-800"
                            >
                              Clear Analysis
                            </button>
                          </div>

{(() => {
                            const formatSectionTitle = (key: string) => {
                              return key
                                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                                .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                                .trim();
                            };

                            const sectionsWithData = Object.entries(githubAnalysis.overallTechnologies || {})
                              .filter(([, technologies]) => Array.isArray(technologies) && technologies.length > 0);

                            if (sectionsWithData.length === 0) {
                              return <div className="text-center py-8 text-neutral-500">No technology data available</div>;
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sectionsWithData.map(([sectionKey, technologies]) => (
                                  <div key={sectionKey} className="bg-white rounded-lg p-4">
                                    <h5 className="font-semibold text-neutral-900 mb-3">{formatSectionTitle(sectionKey)}</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {technologies.map((tech: TechnologyDetection | string, index: number) => {
                                        const name = typeof tech === 'string' ? tech : tech.name;
                                        const confidence = typeof tech === 'object' ? tech.confidence : null;
                                        const source = typeof tech === 'object' ? tech.source : null;
                                        
                                        return (
                                          <span 
                                            key={index} 
                                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-1"
                                            title={confidence ? `${(confidence * 100).toFixed(0)}% confidence from ${source}` : undefined}
                                          >
                                            {name}
                                            {confidence && (
                                              <span className="text-xs opacity-75">
                                                {(confidence * 100).toFixed(0)}%
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                          
                          {/* Contribution Activity Section */}
                          {githubAnalysis.contributionSummary && (
                            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                              <h5 className="font-semibold text-neutral-900 mb-4 flex items-center">
                                <span className="mr-2">🤝</span>
                                Open Source & Collaboration Activity
                              </h5>
                              
                              {/* Activity Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-blue-700">
                                    {githubAnalysis.contributionSummary.totalActivities}
                                  </div>
                                  <div className="text-sm text-blue-600">Total Activities</div>
                                  <div className="text-xs text-neutral-500">{githubAnalysis.contributionSummary.recentActivityPeriod}</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-green-700">
                                    {githubAnalysis.contributionSummary.openSourceContributions}
                                  </div>
                                  <div className="text-sm text-green-600">Open Source</div>
                                  <div className="text-xs text-neutral-500">External projects</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                  <div className="text-2xl font-bold text-purple-700">
                                    {githubAnalysis.contributionSummary.ownRepositoryActivities}
                                  </div>
                                  <div className="text-sm text-purple-600">Own Projects</div>
                                  <div className="text-xs text-neutral-500">Personal repos</div>
                                </div>
                              </div>

                              {/* Activity Breakdown */}
                              {Object.keys(githubAnalysis.contributionSummary.contributionsByType).length > 0 && (
                                <div className="mb-4">
                                  <h6 className="font-medium text-neutral-800 mb-2">Activity Breakdown</h6>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(githubAnalysis.contributionSummary.contributionsByType).map(([type, count]: [string, number], index: number) => {
                                      const typeColors: Record<string, string> = {
                                        push: 'bg-orange-100 text-orange-800',
                                        pull_request: 'bg-blue-100 text-blue-800',
                                        issue: 'bg-yellow-100 text-yellow-800',
                                        review: 'bg-green-100 text-green-800',
                                        fork: 'bg-purple-100 text-purple-800',
                                        create: 'bg-gray-100 text-gray-800'
                                      };
                                      const colorClass = typeColors[type] || 'bg-neutral-100 text-neutral-800';
                                      
                                      return (
                                        <span key={index} className={`px-3 py-1 rounded-full text-sm ${colorClass}`}>
                                          {count} {type.replace('_', ' ')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Open Source Projects */}
                              {githubAnalysis.contributionSummary.activeRepositories && 
                               githubAnalysis.contributionSummary.openSourceContributions > 0 && (
                                <div>
                                  <h6 className="font-medium text-neutral-800 mb-2">Contributing To</h6>
                                  <div className="space-y-2">
                                    {githubAnalysis.contributionSummary.activeRepositories
                                      .filter((repo: string) => !githubAnalysis.analyzedRepositories?.some((own: AnalyzedRepository) => own.name === repo.split('/')[1]))
                                      .slice(0, 6)
                                      .map((repo: string, index: number) => (
                                        <div key={index} className="flex items-center justify-between py-1">
                                          <a 
                                            href={`https://github.com/${repo}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 font-mono text-sm flex items-center"
                                          >
                                            <span className="mr-1">📁</span>
                                            {repo}
                                            <span className="ml-1">↗</span>
                                          </a>
                                        </div>
                                      ))
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Repository Summary */}
                          {githubAnalysis.analyzedRepositories && githubAnalysis.analyzedRepositories.length > 0 && (
                            <div className="bg-white rounded-lg p-4">
                              <h5 className="font-semibold text-neutral-900 mb-3">
                                Analyzed Repositories ({githubAnalysis.analyzedRepositories.length})
                              </h5>
                              <div className="space-y-2">
                                {githubAnalysis.analyzedRepositories.slice(0, 5).map((repo: AnalyzedRepository, index: number) => (
                                  <div key={index} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
                                    <div>
                                      <span className="font-medium text-neutral-900">{repo.name}</span>
                                      {repo.description && (
                                        <p className="text-sm text-neutral-600 mt-1">{repo.description}</p>
                                      )}
                                    </div>

                                  </div>
                                ))}
                                {githubAnalysis.analyzedRepositories.length > 5 && (
                                  <div className="text-sm text-neutral-500 text-center pt-2">
                                    And {githubAnalysis.analyzedRepositories.length - 5} more repositories...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Always show the input section for new analysis */}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="github-url" className="block text-sm font-medium text-neutral-700 mb-2">
                            {githubAnalysis ? 'Analyze Different GitHub Profile' : 'GitHub Profile URL'}
                          </label>
                          <input
                            id="github-url"
                            type="url"
                            placeholder="https://github.com/username"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                          />
                        </div>
                        {githubError && (
                          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                            {githubError}
                          </div>
                        )}
                        <button
                          onClick={analyzeGithubProfile}
                          disabled={loadingGithubAnalysis || !githubUrl.trim()}
                          className="px-4 py-2 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingGithubAnalysis ? 'Analyzing...' : 'Analyze GitHub Profile'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Tab - Always available */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900">Status Timeline</h3>
                    {!props.isExternalView && (
                      <StatusCheckinTriggerButton />
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Check-in Status */}
                    {props.check_in_status && (
                      <div className="bg-white rounded-lg p-4 border border-neutral-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">Current Status</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-base text-neutral-900">
                            {(() => {
                              switch (props.check_in_status) {
                                case 'perusing': return 'Just Perusing';
                                case 'open_to_outreach': return 'Open to Founder Outreaches';
                                case 'request_intros': return 'Curious about Intros';
                                case 'recommend_opportunities': return 'Will Request Intros';
                                case 'actively_searching': return 'Actively Searching for New Opportunities';
                                default: return props.check_in_status;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Timeline of Search */}
                    {props.timeline_of_search && (
                      <div className="bg-white rounded-lg p-4 border border-neutral-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">Interview Timeline</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-base text-neutral-900">
                            {(() => {
                              switch (props.timeline_of_search) {
                                case 'immediate': return 'Immediate - Ready to hop on an intro call and interview now';
                                case 'short_term': return 'Short term - Ready to hop on an intro call but interview in about a month';
                                case 'medium_term': return 'Medium term - Ready to hop on an intro call but actually interview in about 3-6 months';
                                case 'long_term': return 'Long term - Ready to hop on an intro call but maybe hold off on an actual interview';
                                case 'flexible': return 'Flexible - No timeline';
                                default: return props.timeline_of_search;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Outreach Frequency */}
                    {props.outreach_frequency && (
                      <div className="bg-white rounded-lg p-4 border border-neutral-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">Outreach Preference</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-base text-neutral-900">
                            {props.outreach_frequency < 5 && 'Prefers fewer than 5 outreaches per month'}
                            {props.outreach_frequency >= 5 && props.outreach_frequency <= 10 && 'Can handle 5-10 outreaches per month'}
                            {props.outreach_frequency > 10 && props.outreach_frequency <= 20 && 'Comfortable with 10-20 outreaches per month'}
                            {props.outreach_frequency > 20 && 'Can actively respond to 20+ outreaches per month'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Show message if no timeline data available */}
                    {!props.check_in_status && !props.timeline_of_search && !props.outreach_frequency && (
                      <div className="bg-neutral-50 rounded-lg p-6 text-center">
                        <div className="text-sm text-neutral-500">
                          No status information available yet.
                        </div>
                      </div>
                    )}
                  </div>
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