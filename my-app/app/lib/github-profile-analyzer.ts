import GitHubAPI from './github-api';
import GeminiCodeAnalyzer from './gemini-analyzer';
import { 
  TechnologyProfile, 
  AnalyzedRepository, 
  GitHubProfileAnalysis, 
  CodeFile,
  ContributionActivity,
  ContributionSummary,
  GitHubRepo
} from '../types/github-analysis';

export class GitHubProfileAnalyzer {
  private githubAPI: GitHubAPI;
  private geminiAnalyzer: GeminiCodeAnalyzer;

  constructor(githubAppId?: string, githubPrivateKey?: string, geminiApiKey?: string) {
    this.githubAPI = new GitHubAPI(githubAppId, githubPrivateKey);
    this.geminiAnalyzer = new GeminiCodeAnalyzer(geminiApiKey);
  }

  /**
   * Analyze a GitHub user's complete profile
   */
  async analyzeProfile(username: string): Promise<GitHubProfileAnalysis> {

    // Step 1: Get all user repositories
    const repositories = await this.githubAPI.getUserRepositories(username);

    // Step 2: Filter and prioritize repositories for analysis
    const reposToAnalyze = this.prioritizeRepositories(repositories);

    // Step 3: Analyze each repository
    const analyzedRepos: AnalyzedRepository[] = [];
    
    for (const repo of reposToAnalyze) {      
      try {
        const technologies = await this.analyzeRepository(repo.full_name, repo);
        
        analyzedRepos.push({
          name: repo.name,
          description: repo.description || '',
          url: repo.html_url,
          stars: repo.stargazers_count,
          technologies,
          lastUpdated: repo.updated_at,
          size: repo.size
        });

        // Rate limiting - wait between analyses
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`Error analyzing repository ${repo.name}:`, error);
        // Continue with next repository
      }
    }

    // Step 4: Aggregate technologies across all repositories
    const overallTechnologies = this.aggregateTechnologies(analyzedRepos);

    // Step 5: Identify top repositories by stars and activity
    const topRepositories = this.identifyTopRepositories(analyzedRepos);

    // Step 6: Analyze contribution activity across GitHub
    const ownRepositoryNames = repositories.map(repo => repo.full_name);
    const { contributionActivity, contributionSummary } = await this.analyzeContributionActivity(username, ownRepositoryNames);

    return {
      username,
      totalRepositories: repositories.length,
      analyzedRepositories: analyzedRepos,
      overallTechnologies,
      topRepositories,
      contributionActivity,
      contributionSummary,
      analysisDate: new Date().toISOString()
    };
  }

  /**
   * Analyze a single repository
   */
  private async analyzeRepository(fullName: string, repoInfo: GitHubRepo): Promise<TechnologyProfile> {
    const [owner, repo] = fullName.split('/');

    try {
      // Get repository languages and key files based on those languages
      const languages = await this.githubAPI.getRepositoryLanguages(owner, repo);
      const keyFiles = await this.getKeyFiles(owner, repo);

      // Option 1: Quick analysis using repository metadata
      const quickAnalysis = await this.geminiAnalyzer.analyzeRepositorySummary({
        name: repoInfo.name,
        description: repoInfo.description || '',
        topics: repoInfo.topics || [],
        languages: languages,
        keyFiles: keyFiles.map(f => f.name)
      });

      // Option 2: Deep analysis of key files (if we found relevant files)
      if (keyFiles.length > 0 && keyFiles.every(f => f.size < 10000)) {
        const detailedAnalysis = await this.geminiAnalyzer.analyzeRepository(keyFiles);
        return this.mergeTechnologyProfiles([quickAnalysis, detailedAnalysis]);
      }

      return quickAnalysis;

    } catch (error) {
      console.error(`Error analyzing repository ${fullName}:`, error);
      return this.getEmptyProfile();
    }
  }

  /**
   * Get key files from repository based on detected languages
   */
  private async getKeyFiles(owner: string, repo: string): Promise<CodeFile[]> {
    try {
      // Get repository languages first
      const languages = await this.githubAPI.getRepositoryLanguages(owner, repo);
      const topLanguages = Object.keys(languages).slice(0, 3); // Top 3 languages

      // Map languages to their key files
      const languageFileMap: Record<string, string[]> = {
        'JavaScript': ['package.json', 'index.js', 'app.js', 'server.js', 'next.config.js'],
        'TypeScript': ['package.json', 'index.ts', 'app.ts', 'tsconfig.json'],
        'Python': ['requirements.txt', 'setup.py', 'pyproject.toml', 'main.py', 'app.py', '__init__.py'],
        'Go': ['go.mod', 'go.sum', 'main.go'],
        'Rust': ['Cargo.toml', 'Cargo.lock', 'main.rs', 'lib.rs'],
        'Java': ['pom.xml', 'build.gradle', 'application.properties'],
        'C#': ['*.csproj', 'Program.cs', 'Startup.cs'],
        'PHP': ['composer.json', 'index.php', 'config.php'],
        'Ruby': ['Gemfile', 'Gemfile.lock', 'config.rb', 'application.rb'],
        'Swift': ['Package.swift', 'main.swift'],
        'Kotlin': ['build.gradle.kts', 'Main.kt']
      };

      // Always check for these universal files
      const universalFiles = [
        'dockerfile', 'Dockerfile',
        'docker-compose.yml', 'docker-compose.yaml',
        '.github/workflows/ci.yml', '.github/workflows/deploy.yml',
        'README.md'
      ];

      // Build list of files to check based on languages
      const filesToCheck = [...universalFiles];
      
      for (const lang of topLanguages) {
        const langFiles = languageFileMap[lang];
        if (langFiles) {
          filesToCheck.push(...langFiles);
        }
      }

      // Try to fetch each potential file
      const fileContents: CodeFile[] = [];
      const maxFiles = 6; // Limit to prevent too many API calls

      for (const fileName of filesToCheck) {
        if (fileContents.length >= maxFiles) break;

        try {
          const content = await this.githubAPI.getFileContent(owner, repo, fileName);
          const decodedContent = this.githubAPI.decodeFileContent(content.content, content.encoding);
          
          // Skip very large files
          if (content.size > 50000) continue;
          
          fileContents.push({
            name: fileName,
            content: decodedContent,
            path: fileName,
            size: content.size
          });
          
        } catch (error) {
          console.log("File not found ", error)
        }
      }

      return fileContents;

    } catch (error) {
      console.error('Error getting key files:', error);
      return [];
    }
  }

  /**
   * Analyze user's contribution activity across GitHub
   */
  private async analyzeContributionActivity(username: string, ownRepositories: string[]): Promise<{
    contributionActivity: ContributionActivity[];
    contributionSummary: ContributionSummary;
  }> {
    
    try {
      const events = await this.githubAPI.getUserEvents(username, 100);
      const activities: ContributionActivity[] = [];
      const contributionsByType: Record<string, number> = {};
      const activeRepositories = new Set<string>();

      for (const event of events as Array<{
        repo?: { name?: string };
        type: string;
        payload?: {
          commits?: unknown[];
          action?: string;
          ref_type?: string;
        };
        created_at: string;
      }>) {
        const repoName = event.repo?.name || 'unknown';
        const isOwnRepository = ownRepositories.includes(repoName);
        
        let activityType: ContributionActivity['activityType'];
        let details: string;

        switch (event.type) {
          case 'PushEvent':
            activityType = 'push';
            const commits = event.payload?.commits?.length || 0;
            details = `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
            break;
          case 'PullRequestEvent':
            activityType = 'pull_request';
            details = `${event.payload?.action || 'opened'} pull request`;
            break;
          case 'IssuesEvent':
          case 'IssueCommentEvent':
            activityType = 'issue';
            details = `${event.payload?.action || 'commented on'} issue`;
            break;
          case 'PullRequestReviewEvent':
          case 'PullRequestReviewCommentEvent':
            activityType = 'review';
            details = `${event.payload?.action || 'reviewed'} pull request`;
            break;
          case 'ForkEvent':
            activityType = 'fork';
            details = 'Forked repository';
            break;
          case 'CreateEvent':
            activityType = 'create';
            details = `Created ${event.payload?.ref_type || 'repository'}`;
            break;
          default:
            continue; // Skip unknown event types
        }

        activities.push({
          repositoryName: repoName,
          repositoryUrl: `https://github.com/${repoName}`,
          activityType,
          date: event.created_at,
          isOwnRepository,
          details
        });

        activeRepositories.add(repoName);
        contributionsByType[activityType] = (contributionsByType[activityType] || 0) + 1;
      }

      const openSourceContributions = activities.filter(a => !a.isOwnRepository).length;
      const ownRepositoryActivities = activities.filter(a => a.isOwnRepository).length;

      const contributionSummary: ContributionSummary = {
        totalActivities: activities.length,
        openSourceContributions,
        ownRepositoryActivities,
        contributionsByType,
        activeRepositories: Array.from(activeRepositories),
        recentActivityPeriod: "last 90 days" // GitHub events API returns ~90 days
      };

      return {
        contributionActivity: activities.slice(0, 50), // Limit to most recent 50 activities
        contributionSummary
      };

    } catch (error) {
      return {
        contributionActivity: [],
        contributionSummary: {
          totalActivities: 0,
          openSourceContributions: 0,
          ownRepositoryActivities: 0,
          contributionsByType: {},
          activeRepositories: [],
          recentActivityPeriod: `unavailable ${error}`
        }
      };
    }
  }

  /**
   * Prioritize repositories for analysis based on activity, stars, and recency
   */
  private prioritizeRepositories(repositories: GitHubRepo[]): GitHubRepo[] {
    // Filter out forks and very small repositories
    const filtered = repositories.filter(repo => 
      !repo.fork && 
      repo.size > 50 && // Exclude tiny repos (reduced from 100)
      new Date(repo.updated_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Updated within last year
    );

    // Sort by importance (stars + activity)
    const sorted = filtered.sort((a, b) => {
      const scoreA = a.stargazers_count * 2 + (Date.now() - new Date(a.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      const scoreB = b.stargazers_count * 2 + (Date.now() - new Date(b.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return scoreB - scoreA;
    });

    // Return top 15 repositories for analysis
    return sorted.slice(0, 15);
  }

  /**
   * Aggregate technologies across all analyzed repositories
   */
  private aggregateTechnologies(repos: AnalyzedRepository[]): TechnologyProfile {
    const aggregated = this.getEmptyProfile();
    
    for (const repo of repos) {
      Object.keys(aggregated).forEach(category => {
        const key = category as keyof TechnologyProfile;
        aggregated[key] = [...aggregated[key], ...repo.technologies[key]];
      });
    }

    // Remove duplicates and sort by frequency
    Object.keys(aggregated).forEach(category => {
      const key = category as keyof TechnologyProfile;
      aggregated[key] = [...new Set(aggregated[key])];
    });

    return aggregated;
  }

  /**
   * Identify top repositories by various metrics
   */
  private identifyTopRepositories(repos: AnalyzedRepository[]): AnalyzedRepository[] {
    return repos
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 10);
  }

  /**
   * Merge multiple technology profiles
   */
  private mergeTechnologyProfiles(profiles: TechnologyProfile[]): TechnologyProfile {
    const merged = this.getEmptyProfile();

    for (const profile of profiles) {
      Object.keys(merged).forEach(category => {
        const key = category as keyof TechnologyProfile;
        merged[key] = [...merged[key], ...profile[key]];
      });
    }

    // Remove duplicates
    Object.keys(merged).forEach(category => {
      const key = category as keyof TechnologyProfile;
      merged[key] = [...new Set(merged[key])];
    });

    return merged;
  }

  /**
   * Get empty technology profile
   */
  private getEmptyProfile(): TechnologyProfile {
    return {
      frameworks: [],
      databases: [],
      cloudServices: [],
      devOps: [],
      libraries: [],
      architecturalPatterns: [],
      languages: []
    };
  }

  /**
   * Rate limiting helper
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GitHubProfileAnalyzer;