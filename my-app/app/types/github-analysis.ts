// Shared types for GitHub profile analysis

export interface TechnologyProfile {
  frameworks: string[];
  databases: string[];
  cloudServices: string[];
  devOps: string[];
  libraries: string[];
  architecturalPatterns: string[];
  languages: string[];
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  language: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  fork: string;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  content: string;
  encoding: string;
  size: number;
  type: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface AnalyzedRepository {
  name: string;
  description: string;
  url: string;
  stars: number;
  technologies: TechnologyProfile;
  lastUpdated: string;
  size: number;
  language?: string;
}

export interface ContributionActivity {
  repositoryName: string;
  repositoryUrl: string;
  activityType: 'push' | 'pull_request' | 'issue' | 'review' | 'fork' | 'create';
  date: string;
  isOwnRepository: boolean;
  details: string;
}

export interface ContributionSummary {
  totalActivities: number;
  openSourceContributions: number;
  ownRepositoryActivities: number;
  contributionsByType: Record<string, number>;
  activeRepositories: string[];
  recentActivityPeriod: string; // e.g., "last 90 days"
}

export interface GitHubProfileAnalysis {
  username: string;
  totalRepositories: number;
  analyzedRepositories: AnalyzedRepository[];
  overallTechnologies: TechnologyProfile;
  topRepositories: AnalyzedRepository[];
  contributionActivity?: ContributionActivity[];
  contributionSummary?: ContributionSummary;
  analysisDate: string;
}

export interface AnalysisResult {
  technologies: TechnologyProfile;
  confidence: number;
  reasoning?: string;
}

export interface CodeFile {
  name: string;
  content: string;
  path: string;
  size: number;
}

export interface RepositorySummary {
  name: string;
  description: string;
  topics: string[];
  languages: Record<string, number>;
  keyFiles: string[];
}