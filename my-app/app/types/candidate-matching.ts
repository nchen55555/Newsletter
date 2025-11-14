// Types for candidate matching functionality

export interface SkillScores {
  systems_infrastructure: number;
  theory_statistics_ml: number;
  product: number;
  github_similarity?: number; // 0-1 similarity score from GitHub embedding
}

export interface CandidateMatch {
  candidate_id: string;
  distance: number;
  similarity: number;
  similarity_percentage: number;
  skills: SkillScores;
  skill_differences: SkillScores;
}

export interface FindSimilarResponse {
  success: boolean;
  matches: CandidateMatch[];
  database_size: number;
  query_skills: SkillScores;
  candidate_added?: boolean;
  added_candidate_id?: string;
  new_database_size?: number;
  error?: string;
}

export interface CandidateProfile {
  id: number;
  first_name: string;
  last_name: string;
}

export interface EnrichedCandidateMatch extends CandidateMatch {
  profile: CandidateProfile | null;
  error?: string;
}

export interface MatchSummary {
  total_matches: number;
  profiles_found: number;
  average_similarity: number;
  best_match_similarity: number;
  query_profile: SkillScores;
  database_size: number;
}

export interface GetCandidateMatchesResponse {
  success: boolean;
  matches: EnrichedCandidateMatch[];
  summary: MatchSummary;
  metadata: {
    timestamp: string;
    total_candidates_in_database: number;
    query_skills: SkillScores;
  };
  error?: string;
}