// Shared types for GitHub profile analysis

export interface TechnologyDetection {
  name: string;
  confidence: number; // 0.0 to 1.0 scale
  source: 'commit' | 'file' | 'metadata'; // Detection source for debugging
  repositorySource?: string; // Which repository this was detected in
}

export interface TechnologyProfile {
  // Core programming languages
  languages: TechnologyDetection[];
  
  // Web frameworks and libraries
  webFrameworks: TechnologyDetection[];
  libraries: TechnologyDetection[];
  
  // Data layer experience
  databases: TechnologyDetection[];
  dataProcessing: TechnologyDetection[];
  orm: TechnologyDetection[];
  
  // Systems and infrastructure
  containerization: TechnologyDetection[];
  orchestration: TechnologyDetection[];
  cloudPlatforms: TechnologyDetection[];
  infrastructure: TechnologyDetection[];
  
  // Distributed systems
  distributedSystems: TechnologyDetection[];
  messagingQueues: TechnologyDetection[];
  consensus: TechnologyDetection[];
  
  // DevOps and CI/CD
  cicd: TechnologyDetection[];
  monitoring: TechnologyDetection[];
  deployment: TechnologyDetection[];
  
  // Architectural patterns
  architecturalPatterns: TechnologyDetection[];
  designPatterns: TechnologyDetection[];
  
  // Security
  security: TechnologyDetection[];
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

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: 'added' | 'removed' | 'modified' | 'renamed';
  }>;
}

export interface AnalyzedRepository {
  name: string;
  description: string;
  url: string;
  technologies: TechnologyProfile;
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