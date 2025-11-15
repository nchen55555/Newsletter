import GitHubAPI from './github-api';
import GeminiCodeAnalyzer from './gemini-analyzer';
import { 
  TechnologyProfile, 
  TechnologyDetection,
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
   * Check if two names are similar enough to be considered the same person
   */
  private isNameSimilar(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;
    
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z\s]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // One contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Split into words and check for common words (first name, last name matches)
    const words1 = n1.split(/\s+/).filter(w => w.length > 1);
    const words2 = n2.split(/\s+/).filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) return false;
    
    // Check if any significant words match
    const commonWords = words1.filter(w1 => 
      words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
    );
    
    // Consider similar if at least one word matches and it's not too short
    return commonWords.length > 0 && commonWords.some(w => w.length >= 3);
  }

  /**
   * Analyze a GitHub user's complete profile
   */
  async analyzeProfile(username: string, userRealName?: string): Promise<GitHubProfileAnalysis> {

    // Step 1: Get all user repositories
    const repositories = await this.githubAPI.getUserRepositories(username);

    // Step 2: Get recent commits across repositories (last year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const repoCommitActivity = await this.analyzeRecentCommitActivity(repositories, username, userRealName, oneYearAgo.toISOString());

    // Step 3: Filter and prioritize repositories based on recent commit activity
    const reposToAnalyze = this.prioritizeRepositoriesByCommitActivity(repoCommitActivity);

    // Step 4: Analyze each repository using commit-based file selection with retry logic
    const analyzedRepos: AnalyzedRepository[] = [];
    
    for (const repoData of reposToAnalyze) {
      const fullName = repoData.repo.full_name;
      
      let technologies: TechnologyProfile | null = null;
      
      // Retry logic with exponential backoff
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          technologies = await this.analyzeRepositoryByCommits(fullName, repoData);
          break; // Success, exit retry loop
          
        } catch (error) {
          const isRateLimit = error instanceof Error && (
            error.message.includes('rate limit') ||
            error.message.includes('403') ||
            error.message.includes('exceeded')
          );
          
          if (isRateLimit && attempt < 5) {
            // Exponential backoff for rate limiting: 5s, 15s, 30s, 60s, 120s
            const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 120000);
            await this.sleep(waitTime);
          } else if (attempt < 5) {
            // For other errors, shorter wait
            await this.sleep(2000);
          }
        }
      }
      
      if (technologies) {
        analyzedRepos.push({
          name: repoData.repo.name,
          description: repoData.repo.description || '',
          url: repoData.repo.html_url,
          technologies,
          size: repoData.repo.size
        });
        
        // Rate limiting - wait between analyses (reduced since we have retry logic)
        await this.sleep(500);
      } 
    }

    // Step 5: Aggregate technologies across all repositories
    const overallTechnologies = this.aggregateTechnologies(analyzedRepos);

    // Step 6: Analyze contribution activity across GitHub
    const ownRepositoryNames = repositories.map(repo => repo.full_name);
    const { contributionActivity, contributionSummary } = await this.analyzeContributionActivity(username, ownRepositoryNames);

    return {
      username,
      totalRepositories: repositories.length,
      analyzedRepositories: analyzedRepos,
      overallTechnologies,
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
   * Analyze recent commit activity across repositories to identify active ones
   */
  private async analyzeRecentCommitActivity(repositories: GitHubRepo[], username: string, userRealName: string | undefined, since: string): Promise<Array<{
    repo: GitHubRepo;
    commitCount: number;
    recentFiles: string[];
  }>> {
    const repoActivity = [];

    for (const repo of repositories.slice(0, 20)) { // Limit initial scan
      if (repo.size < 50) {
        continue;
      }
      // Note: Now including forks in analysis!

      try {
        const commits = await this.githubAPI.getRepositoryCommits(
          repo.full_name.split('/')[0],
          repo.full_name.split('/')[1],
          since
        );
        // Filter commits by the target username and real name (more flexible matching)
        const strictUserCommits = commits.filter(commit => {
          const authorName = commit.commit.author.name;
          const authorEmail = commit.commit.author.email;
          
          // Check email contains username
          if (authorEmail.includes(username)) return true;
          
          // Check if author name is similar to username
          if (this.isNameSimilar(authorName, username)) return true;
          
          // Check if author name is similar to user's real name from Supabase
          if (userRealName && this.isNameSimilar(authorName, userRealName)) return true;
          
          return false;
        });
        
        // For forks, also try a more permissive filter if strict filtering finds nothing
        let userCommits = strictUserCommits;
        if (repo.fork && strictUserCommits.length === 0 && commits.length > 0) {
          // For forks, if we find no user commits, take the most recent commits regardless of author
          // This helps us analyze what technologies they're interested in (even if they haven't contributed)
          userCommits = commits.slice(0, 5); // Just take recent commits to see technologies
        } 

        if (userCommits.length > 0) {
          // Collect files changed in recent commits by fetching individual commit details
          const recentFiles: string[] = [];
          for (const commit of userCommits.slice(0, 5)) { // Limit to prevent too many API calls
            try {
              const commitDetails = await this.githubAPI.getCommitDetails(
                repo.full_name.split('/')[0],
                repo.full_name.split('/')[1],
                commit.sha
              );
              
              if (commitDetails?.files) {
                recentFiles.push(...commitDetails.files.map(f => f.filename));
              }
            } catch (error) {
              console.log(`[COMMIT ANALYSIS] Failed to get details for commit ${commit.sha.substring(0, 7)}:`, error);
            }
          }

          const uniqueFiles = [...new Set(recentFiles)];

          repoActivity.push({
            repo,
            commitCount: userCommits.length,
            recentFiles: uniqueFiles
          });
        }

        await this.sleep(500); // Rate limiting
      } catch (error) {
        console.error(`[COMMIT ANALYSIS] Error analyzing commits for ${repo.name}:`, error);
        continue;
      }
    }

    return repoActivity;
  }

  /**
   * Prioritize repositories based on recent commit activity
   */
  private prioritizeRepositoriesByCommitActivity(repoActivity: Array<{
    repo: GitHubRepo;
    commitCount: number;
    recentFiles: string[];
  }>): Array<{
    repo: GitHubRepo;
    commitCount: number;
    recentFiles: string[];
  }> {
    return repoActivity
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 10); // Analyze top 10 most active repos
  }

  /**
   * Analyze repository based on recent commit activity and changed files
   */
  private async analyzeRepositoryByCommits(fullName: string, repoData: {
    repo: GitHubRepo;
    commitCount: number;
    recentFiles: string[];
  }): Promise<TechnologyProfile> {
    const [owner, repo] = fullName.split('/');

    try {      
      // Get repository languages
      const languages = await this.githubAPI.getRepositoryLanguages(owner, repo);
      
      // Use recently changed files from commits instead of static key files
      const keyFiles = await this.getFilesFromCommitActivity(owner, repo, repoData.recentFiles);

      // Repository metadata analysis (30% confidence weight)
      const quickAnalysis = await this.geminiAnalyzer.analyzeRepositorySummary({
        name: repoData.repo.name,
        description: repoData.repo.description || '',
        topics: repoData.repo.topics || [],
        languages: languages,
        keyFiles: repoData.recentFiles
      });
      const metadataProfile = this.applyConfidenceWeighting(quickAnalysis, 0.3, 'metadata', fullName);

      // File content analysis (80% confidence weight) for recently changed files
      if (keyFiles.length > 0 && keyFiles.every(f => f.size < 10000)) {
        const detailedAnalysis = await this.geminiAnalyzer.analyzeRepository(keyFiles);
        const fileProfile = this.applyConfidenceWeighting(detailedAnalysis, 0.8, 'file', fullName);

        // For repositories with commit activity, prioritize file analysis over metadata
        const combined = this.mergeTechnologyProfiles([fileProfile, metadataProfile]);
        return combined;
      }

      // For repos without good file content, boost commit-detected metadata slightly
      const commitBoostProfile = this.applyConfidenceWeighting(quickAnalysis, 0.6, 'commit', fullName);
      return commitBoostProfile;

    } catch (error) {
      console.error(`Error analyzing repository ${fullName}:`, error);
      return this.getEmptyProfile();
    }
  }

  /**
   * Get file contents from recently changed files in commits
   */
  private async getFilesFromCommitActivity(owner: string, repo: string, recentFiles: string[]): Promise<CodeFile[]> {
    const fileContents: CodeFile[] = [];
    const maxFiles = 8;

    // Prioritize certain file types that reveal technology choices
    const priorityFiles = recentFiles.filter(file => 
      file.match(/\.(json|toml|yml|yaml|md|dockerfile|tf|sql|py|js|ts|go|rs|java|cs)$/i) ||
      file.includes('docker') ||
      file.includes('config') ||
      file.includes('requirements') ||
      file.includes('package') ||
      file.includes('cargo') ||
      file.includes('pom') ||
      file.includes('gradle')
    );

    const filesToCheck = [...priorityFiles, ...recentFiles].slice(0, maxFiles);

    for (const fileName of filesToCheck) {
      if (fileContents.length >= maxFiles) break;

      try {
        const content = await this.githubAPI.getFileContent(owner, repo, fileName);
        const decodedContent = this.githubAPI.decodeFileContent(content.content, content.encoding);
        
        if (content.size > 50000) {
          continue;
        }
        
        fileContents.push({
          name: fileName,
          content: decodedContent,
          path: fileName,
          size: content.size
        });
        
      } catch (error) {
        console.log(`[FILE ANALYSIS] Failed to load ${fileName}:`, error);
        continue;
      }
    }
    return fileContents;
  }

  /**
   * Aggregate technologies across all analyzed repositories with confidence weighting
   */
  private aggregateTechnologies(repos: AnalyzedRepository[]): TechnologyProfile {
    const technologyScores = new Map<string, Map<string, { maxConfidence: number, sources: string[] }>>();

    // Collect all technology detections with their scores
    for (const repo of repos) {
      Object.keys(repo.technologies).forEach(category => {
        const key = category as keyof TechnologyProfile;
        const detections = repo.technologies[key] as TechnologyDetection[];
        
        if (!technologyScores.has(key)) {
          technologyScores.set(key, new Map());
        }
        const categoryMap = technologyScores.get(key)!;

        for (const detection of detections) {
          const existing = categoryMap.get(detection.name);
          if (!existing || detection.confidence > existing.maxConfidence) {
            categoryMap.set(detection.name, {
              maxConfidence: detection.confidence,
              sources: existing?.sources ? [...existing.sources, repo.name] : [repo.name]
            });
          }
        }
      });
    }

    // Build final profile with confidence thresholds
    const aggregated = this.getEmptyProfile();
    const confidenceThreshold = 0.4; // Only include technologies with confidence >= 40%

    technologyScores.forEach((categoryMap, category) => {
      const key = category as keyof TechnologyProfile;
      const filtered: TechnologyDetection[] = [];

      categoryMap.forEach((data, techName) => {
        if (data.maxConfidence >= confidenceThreshold) {
          filtered.push({
            name: techName,
            confidence: data.maxConfidence,
            source: 'commit', // Primary source for aggregated results
            repositorySource: data.sources.join(', ')
          });
        }
      });

      // Sort by confidence descending
      filtered.sort((a, b) => b.confidence - a.confidence);
      aggregated[key] = filtered;
    });

    return aggregated;
  }


  /**
   * Merge multiple technology profiles with confidence weighting
   */
  private mergeTechnologyProfiles(profiles: TechnologyProfile[]): TechnologyProfile {
    const technologyScores = new Map<string, Map<string, TechnologyDetection>>();

    // Collect all detections with their confidence scores
    for (const profile of profiles) {
      Object.keys(profile).forEach(category => {
        const key = category as keyof TechnologyProfile;
        const detections = profile[key] as TechnologyDetection[];
        
        if (!technologyScores.has(key)) {
          technologyScores.set(key, new Map());
        }
        const categoryMap = technologyScores.get(key)!;

        for (const detection of detections) {
          const existing = categoryMap.get(detection.name);
          // Keep the detection with highest confidence
          if (!existing || detection.confidence > existing.confidence) {
            categoryMap.set(detection.name, detection);
          }
        }
      });
    }

    // Build merged profile
    const merged = this.getEmptyProfile();
    technologyScores.forEach((categoryMap, category) => {
      const key = category as keyof TechnologyProfile;
      merged[key] = Array.from(categoryMap.values())
        .sort((a, b) => b.confidence - a.confidence);
    });

    return merged;
  }

  /**
   * Get empty technology profile
   */
  private getEmptyProfile(): TechnologyProfile {
    return {
      languages: [],
      webFrameworks: [],
      libraries: [],
      databases: [],
      dataProcessing: [],
      orm: [],
      containerization: [],
      orchestration: [],
      cloudPlatforms: [],
      infrastructure: [],
      distributedSystems: [],
      messagingQueues: [],
      consensus: [],
      cicd: [],
      monitoring: [],
      deployment: [],
      architecturalPatterns: [],
      designPatterns: [],
      security: []
    };
  }

  /**
   * Apply confidence weighting to a technology profile
   */
  private applyConfidenceWeighting(
    profile: TechnologyProfile, 
    weight: number, 
    source: 'commit' | 'file' | 'metadata', 
    repositorySource: string
  ): TechnologyProfile {
    const weighted = this.getEmptyProfile();
    
    Object.keys(profile).forEach(category => {
      const key = category as keyof TechnologyProfile;
      const techs = profile[key] as TechnologyDetection[];
      
      weighted[key] = techs.map(tech => ({
        ...tech,
        confidence: tech.confidence * weight,
        source: source,
        repositorySource: repositorySource
      }));
    });
    
    return weighted;
  }

  /**
   * Summarize a technology profile for logging
   */
  private summarizeProfile(profile: TechnologyProfile): Record<string, string[]> {
    const summary: Record<string, string[]> = {};
    
    Object.keys(profile).forEach(category => {
      const key = category as keyof TechnologyProfile;
      const techs = profile[key] as TechnologyDetection[];
      
      if (techs.length > 0) {
        summary[key] = techs.map(t => `${t.name}(${(t.confidence * 100).toFixed(0)}%)`);
      }
    });
    
    return summary;
  }

  /**
   * Rate limiting helper
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GitHubProfileAnalyzer;