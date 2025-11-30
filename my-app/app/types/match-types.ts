/**
 * Type definitions for candidate matching, company compatibility, and similarity calculations
 */

import { ProfileData } from "../types";

// Tab types for profile navigation
export type AvailableTab = "scores" | "bookmarks" | "threads" | "referrals" | "projects" | "connections" | "similar" | "timeline";

export interface SkillScores {
  systems_infrastructure: number;
  theory_statistics_ml: number;
  product: number;
  repository_similarity?: number; // 0-1 similarity score from GitHub embedding
}

// Company compatibility response from the similarity API
export interface CompanyCompatibilityResponse {
  distance: number;
  similarity: number;
  similarity_percentage: number;
  skills: SkillScores;
  company_requirements: SkillScores;
  skill_differences: SkillScores;
  cluster_stats: {
    center: SkillScores;
    std_dev: SkillScores;
    cluster_weights: SkillScores;
    final_weights: SkillScores;
    sample_size: number;
  };
}

// Company data structure
export interface CompanyData {
  name?: string;
  match_profiles?: string[];
  [key: string]: unknown;
}

// Candidate data from matching results
export interface MatchingCandidate {
  candidate_id: string;
  skills: SkillScores;
  [key: string]: unknown;
}

// Reference profile for company similarity calculation
export interface ReferenceProfile {
  systems_infrastructure: number;
  theory_statistics_ml: number;
  product: number;
  repository_similarity?: number;
}

// Props for external profile component  
// Note: This extends ProfileData which contains all the profile fields like id, bio, etc.
export interface ExternalProfileProps extends ProfileData {
  isExternalView?: boolean;
  client_id?: number;
  is_client_specific?: boolean;
}

// Similarity calculation weights
export interface SimilarityWeights {
  systems_infrastructure: number;
  theory_statistics_ml: number;
  product: number;
  repository_similarity?: number;
  [key: string]: number | undefined; // Index signature to allow dynamic property access
}

// Candidate match result with profile information
export interface CandidateMatch {
  candidate_id: string;
  distance: number;
  similarity: number;
  similarity_percentage: number;
  skills: SkillScores;
  profile?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
}