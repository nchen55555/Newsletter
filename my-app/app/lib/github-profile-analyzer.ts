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
  GitHubRepo,
} from '../types/github-analysis';

type ContributedFile = {
  filename: string;
  content: string;
  path: string;
  size: number;
  repositoryName: string;
  repositoryFullName: string;
  repositoryDescription?: string;
  primaryLanguage?: string;
};

export class GitHubProfileAnalyzer {
  private githubAPI: GitHubAPI;
  private geminiAnalyzer: GeminiCodeAnalyzer;

  constructor(githubAppId?: string, githubPrivateKey?: string, geminiApiKey?: string) {
    this.githubAPI = new GitHubAPI(githubAppId, githubPrivateKey);
    this.geminiAnalyzer = new GeminiCodeAnalyzer(geminiApiKey);
  }

  /**
   * Determine if a file should be analyzed based on path, extension, and content
   */
  private shouldAnalyzeFile(filename: string, content?: string, size?: number): boolean {
    // Size check first (if provided)
    if (size && size > 1024 * 1024) return false; // Skip files > 1MB
    
    // Known binary extensions to always skip
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib', '.bin',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.ttf', '.woff', '.woff2', '.eot',
      '.lock' // package-lock.json, Cargo.lock, etc.
    ];
    
    const lowerFilename = filename.toLowerCase();
    if (binaryExtensions.some(ext => lowerFilename.endsWith(ext))) {
      return false;
    }
    
    // Whitelist known code/config file extensions
    const textExtensions = [
      '.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.sql',
      '.html', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.md', '.txt', '.sh', '.bat', '.ps1', '.dockerfile', '.tf', '.vue', '.svelte',
      '.lua', '.vim', '.conf', '.config', '.cfg', '.ini', '.env', '.toml', '.snippets', '.gitignore', '.gitattributes'
    ];
    
    if (textExtensions.some(ext => lowerFilename.endsWith(ext))) {
      return true;
    }
    
    // Whitelist important dotfile paths (extensionless config files)
    const allowedPaths = [
      /^\.config\//,
      /^\.ssh\/config$/,
      /^\.zshrc$/,
      /^\.bashrc$/,
      /^\.vimrc$/,
      /^\.tmux\.conf$/,
      /^\.gitconfig$/,
      /^brewfile$/i,
      /dockerfile$/i,
      /makefile$/i,
      /rakefile$/i,
      /gemfile$/i,
      /procfile$/i,
      /^\.env/,
      /^\.editorconfig$/
    ];
    
    if (allowedPaths.some(pattern => pattern.test(filename))) {
      return true;
    }
    
    // For extensionless files, check content if available
    if (!filename.includes('.') && content) {
      return this.isTextContent(content);
    }
    
    // Default: reject extensionless files without content check
    return filename.includes('.');
  }

  /**
   * Check if content appears to be text (not binary)
   */
  private isTextContent(content: string): boolean {
    // Check first 8KB for null bytes (binary indicator)
    const sample = content.slice(0, 8192);
    const nullBytes = (sample.match(/\0/g) || []).length;
    
    // If >1% null bytes, likely binary
    return nullBytes / sample.length < 0.01;
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
   * Analyze a GitHub user's complete profile based on their actual contributions
   */
  async analyzeProfile(username: string, userRealName?: string): Promise<GitHubProfileAnalysis> {

    // Step 1: Get all user repositories (owned)
    const repositories = await this.githubAPI.getUserRepositories(username);

    // Step 2: Get ALL files the user has contributed to (owned + contributed repos)
    const contributedFiles = await this.getAllUserContributions(
      repositories,
      username,
      userRealName,
      100,
    );

    // Step 3: Group files by repository for embedding creation (skip technology analysis)
    let repositoryGroups: Map<string, ContributedFile[]> = new Map();

    if (contributedFiles.length > 0) {
      // Just group files by repository - embeddings will handle tech analysis
      repositoryGroups = this.groupFilesByRepository(contributedFiles);
      console.log(`[CONTRIB ANALYSIS] Grouped ${contributedFiles.length} files into ${repositoryGroups.size} repositories`);
    } else {
      console.log(`[CONTRIB ANALYSIS] No contributed files found for ${username}`);
    }

    // Step 6: Analyze contribution activity across GitHub
    const ownRepositoryNames = repositories.map(repo => repo.full_name);
    const { contributionSummary } = await this.analyzeContributionActivity(username, ownRepositoryNames);

    const repositoryGroupsArray = Array.from(repositoryGroups.entries()).map(
      ([repoFullName, files]) => {
        const first = files[0];
        const repoName =
          first?.repositoryName || repoFullName.split('/')[1] || repoFullName;

        return {
          repositoryName: repoName,
          fullName: repoFullName,
          description: first?.repositoryDescription,
          url: `https://github.com/${repoFullName}`,
          language: first?.primaryLanguage,
          files: files.map((f: ContributedFile) => ({
            name: f.filename,
            content: f.content,
            path: f.path,
            size: f.size,
          })),
          contributionCount: files.length,
        };
      },
    );

    return {
      username,
      totalRepositories: repositories.length,
      analyzedRepositories: [],
      overallTechnologies: this.getEmptyProfile(),
      contributionSummary,
      repositoryGroups: repositoryGroupsArray,
      analysisDate: new Date().toISOString(),
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
   * Get repositories the user has contributed to (not necessarily owned) via GitHub Events
   */
  private async getContributedRepositories(username: string, _userRealName?: string): Promise<Set<string>> {
    const contributedRepos = new Set<string>();
    
    try {
      // Get user events (last 300 events should cover decent time range)
      const events = await this.githubAPI.getUserEvents(username, 300);
      
      for (const event of events as Array<{
        repo?: { name?: string };
        type: string;
        actor?: { login?: string; display_login?: string };
      }>) {
        const repoName = event.repo?.name;
        if (!repoName) continue;
        
        // Verify this is actually their activity (sometimes events can be mixed)
        const actorLogin = event.actor?.login || event.actor?.display_login;
        if (actorLogin && !this.isNameSimilar(actorLogin, username)) {
          continue;
        }
        
        // Include repositories from contribution events
        if (['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'PullRequestReviewEvent'].includes(event.type)) {
          contributedRepos.add(repoName);
        }
      }
      
      console.log(`[CONTRIB ANALYSIS] Found ${contributedRepos.size} contributed repositories for ${username}`);
      
    } catch (error) {
      console.error(`[CONTRIB ANALYSIS] Error getting contributed repositories for ${username}:`, error);
    }
    
    return contributedRepos;
  }

  /**
   * Get up to maxFiles files that the user has actually contributed to across all repositories
   */
  private async getAllUserContributions(
    ownedRepositories: GitHubRepo[],
    username: string,
    userRealName?: string,
    maxFiles: number = 100,
  ): Promise<
    Array<{
      filename: string;
      content: string;
      path: string;
      size: number;
      repositoryName: string;
      repositoryFullName: string;
      repositoryDescription?: string;
      primaryLanguage?: string;
    }>
  > {
    const contributedFiles: ContributedFile[] = [];
    const processedRepos = new Set<string>();
    
    try {
      // Step 1: Get repositories they contributed to (not owned)
      const contributedRepoNames = await this.getContributedRepositories(username, userRealName);
      
      // Step 2: Combine owned + contributed repositories
      const allRepoNames = new Set<string>();
      
      // Add owned repositories
      ownedRepositories.forEach(repo => allRepoNames.add(repo.full_name));
      
      // Add contributed repositories
      contributedRepoNames.forEach(repoName => allRepoNames.add(repoName));
      
      console.log(`[CONTRIB ANALYSIS] Analyzing ${allRepoNames.size} total repositories (${ownedRepositories.length} owned + ${contributedRepoNames.size} contributed)`);
      console.log(`[CONTRIB ANALYSIS] Repositories to analyze:`, Array.from(allRepoNames).slice(0, 10)); // Show first 10
      
      // Step 3: For each repository, get files they actually modified
      for (const repoFullName of allRepoNames) {
        if (contributedFiles.length >= maxFiles) {
          console.log(`[CONTRIB ANALYSIS] Reached maxFiles limit (${maxFiles}), stopping analysis`);
          break;
        }
        if (processedRepos.has(repoFullName)) continue;
        
        processedRepos.add(repoFullName);
        
        try {
          const [owner, repo] = repoFullName.split('/');
          if (!owner || !repo) continue;
          
          console.log(`[CONTRIB ANALYSIS] Processing repository: ${repoFullName}`);
          
          // Get their commits in this repository (no time limit, just count limit)
          const commits = await this.githubAPI.getRepositoryCommits(owner, repo);
          
          // Filter for their commits using flexible name matching
          const userCommits = commits.filter(commit => {
            const authorName = commit.commit.author.name;
            const authorEmail = commit.commit.author.email;
            
            if (authorEmail.includes(username)) return true;
            if (this.isNameSimilar(authorName, username)) return true;
            if (userRealName && this.isNameSimilar(authorName, userRealName)) return true;
            
            return false;
          });
          
          if (userCommits.length === 0) {
            console.log(`[CONTRIB ANALYSIS] No user commits found in ${repoFullName}`);
            continue;
          }
          
          console.log(`[CONTRIB ANALYSIS] Found ${userCommits.length} user commits in ${repoFullName}`);
          
          // Get repository info for context
          let repoInfo;
          try {
            repoInfo = await this.githubAPI.getRepository(owner, repo);
          } catch (error) {
            console.log(`[CONTRIB ANALYSIS] Could not get repo info for ${repoFullName}:`, error);
            continue;
          }
          
          // Get files they actually modified from their commits
          const fileCommitMap = new Map<string, string>(); // Map file path to commit SHA
          for (const commit of userCommits.slice(0, 10)) { // Limit to prevent too many API calls
            try {
              const commitDetails = await this.githubAPI.getCommitDetails(owner, repo, commit.sha);
              if (commitDetails?.files) {
                commitDetails.files.forEach(file => {
                  // Only include added/modified files (not deleted)
                  if (['added', 'modified'].includes(file.status)) {
                    // Store the most recent commit SHA for each file
                    if (!fileCommitMap.has(file.filename)) {
                      fileCommitMap.set(file.filename, commit.sha);
                    }
                  }
                });
              }
            } catch (error) {
              console.log(`[CONTRIB ANALYSIS] Failed to get commit details for ${commit.sha.substring(0, 7)}:`, error);
            }
          }
          
          // Get content of files they actually modified using commit-specific content
          for (const [filename, commitSha] of fileCommitMap.entries()) {
            if (contributedFiles.length >= maxFiles) break;
            
            try {
              // Enhanced file filtering logic
              if (!this.shouldAnalyzeFile(filename)) {
                console.log(`[CONTRIB ANALYSIS] Skipping binary file: ${filename}`);
                continue;
              }
              
              const content = await this.githubAPI.getFileContentAtCommit(owner, repo, filename, commitSha);
              const decodedContent = this.githubAPI.decodeFileContent(content.content, content.encoding);
              
              // Skip very large files
              if (content.size > 50000) continue;
              
              // Final check with content and size
              if (!this.shouldAnalyzeFile(filename, decodedContent, content.size)) {
                console.log(`[CONTRIB ANALYSIS] Skipping after content check: ${filename}`);
                continue;
              }
              
              contributedFiles.push({
                filename: filename.split('/').pop() || filename,
                content: decodedContent,
                path: filename,
                size: content.size,
                repositoryName: repoInfo.name,
                repositoryFullName: repoFullName,
                repositoryDescription: repoInfo.description ?? undefined,
                primaryLanguage: repoInfo.language ?? undefined,
              });
              
            } catch (error) {
              console.log(`[CONTRIB ANALYSIS] Failed to load file ${filename} at commit ${commitSha.substring(0, 7)} from ${repoFullName}:`, error);
            }
          }
          
          await this.sleep(500); // Rate limiting between repos
          
        } catch (error) {
          console.error(`[CONTRIB ANALYSIS] Error analyzing repository ${repoFullName}:`, error);
        }
      }
      
      console.log(`[CONTRIB ANALYSIS] Collected ${contributedFiles.length} files from ${processedRepos.size} repositories`);
      
    } catch (error) {
      console.error(`[CONTRIB ANALYSIS] Error in getAllUserContributions:`, error);
    }
    
    return contributedFiles;
  }

  /**
   * Group contributed files by repository for embedding creation
   */
  private groupFilesByRepository(
    contributedFiles: ContributedFile[],
  ): Map<string, ContributedFile[]> {
    const filesByRepo = new Map<string, ContributedFile[]>();
    
    contributedFiles.forEach(file => {
      const repoKey = file.repositoryFullName;
      if (!filesByRepo.has(repoKey)) {
        filesByRepo.set(repoKey, []);
      }
      filesByRepo.get(repoKey)!.push(file);
    });
    
    return filesByRepo;
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