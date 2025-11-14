import { App } from '@octokit/app';
import { GitHubRepo, GitHubFileContent, GitHubTree } from '../types/github-analysis';

interface OctokitInstance {
  request: <T>(route: string, params?: Record<string, string | number>) => Promise<{ data: T }>;
}

export class GitHubAPI {
  private app: App;
  private octokit: OctokitInstance | null;

  constructor(appId?: string, privateKey?: string) {
    const id = appId || process.env.GITHUB_APP_ID;
    const key = privateKey || process.env.GITHUB_PRIVATE_KEY;

    if (!id || !key) {
      throw new Error('GitHub App ID and private key are required. Set GITHUB_APP_ID and GITHUB_PRIVATE_KEY environment variables.');
    }

    this.app = new App({
      appId: id,
      privateKey: key.replace(/\\n/g, '\n'), // Handle escaped newlines in env vars
    });

    // Initialize as null - will be set up with installation auth when needed
    this.octokit = null;
  }

  /**
   * Get authenticated Octokit instance for installation
   */
  private async getOctokit() {
    
    if (!this.octokit) {
      try {
        const installationIdStr = process.env.GITHUB_INSTALLATION_ID;
        
        if (!installationIdStr) {
          throw new Error('GITHUB_INSTALLATION_ID environment variable is not set');
        }
        
        const installationId = Number(installationIdStr);
        
        if (isNaN(installationId)) {
          throw new Error(`Invalid GITHUB_INSTALLATION_ID: ${installationIdStr}`);
        }
        
        this.octokit = await this.app.getInstallationOctokit(installationId) as OctokitInstance;
      } catch (error) {
        throw new Error(`Failed to authenticate GitHub App: ${error}`);
      }
    }
    return this.octokit;
  }


  /**
   * Get all public repositories for a user with pagination
   */
  async getUserRepositories(username: string): Promise<GitHubRepo[]> {
    try {
      const octokit = await this.getOctokit();
      let allRepos: GitHubRepo[] = [];
      let page = 1;
      const perPage = 100; // Maximum allowed by GitHub API

      while (true) {
        const response = await octokit.request<GitHubRepo[]>('GET /users/{username}/repos', {
          username,
          type: 'owner',
          sort: 'updated',
          per_page: perPage,
          page: page
        });

        const repos = response.data;

        if (repos.length === 0) {
          break; // No more repositories
        }

        // Filter out private repos and add to collection
        const publicRepos = repos.filter((repo) => !repo.private);
        allRepos = allRepos.concat(publicRepos);

        // If we got fewer than perPage repos, we're on the last page
        if (repos.length < perPage) {
          break;
        }

        page++;
      }

      return allRepos;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        throw new Error(`GitHub user not found: ${username}`);
      }
      throw new Error(`GitHub API error: ${err.status} ${err.message}`);
    }
  }

  /**
   * Get the file tree for a repository
   */
  async getRepositoryTree(owner: string, repo: string, sha = 'HEAD'): Promise<GitHubTree> {
    try {
      const octokit = await this.getOctokit();
      const response = await octokit.request<GitHubTree>('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
        owner,
        repo,
        tree_sha: sha,
        recursive: '1'
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        throw new Error(`Repository or tree not found: ${owner}/${repo}`);
      }
      throw new Error(`GitHub API error: ${err.status} ${err.message}`);
    }
  }

  /**
   * Get the content of a specific file
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<GitHubFileContent> {
    try {
      const octokit = await this.getOctokit();
      const response = await octokit.request<GitHubFileContent>('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 404) {
        throw new Error(`File not found: ${path}`);
      }
      throw error;
    }
  }

  /**
   * Get repository languages (GitHub's automatic detection)
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const octokit = await this.getOctokit();
      const response = await octokit.request<Record<string, number>>('GET /repos/{owner}/{repo}/languages', {
        owner,
        repo
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      throw new Error(`GitHub API error: ${err.status} ${err.message}`);
    }
  }

  /**
   * Check current rate limit status
   */
  async getRateLimit(): Promise<unknown> {
    try {
      const octokit = await this.getOctokit();
      const response = await octokit.request<Record<string, number>>('GET /rate_limit');
      return response.data;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      throw new Error(`GitHub API error: ${err.status} ${err.message}`);
    }
  }

  /**
   * Decode base64 content from GitHub API
   */
  decodeFileContent(content: string, encoding: string): string {
    if (encoding === 'base64') {
      return Buffer.from(content, 'base64').toString('utf-8');
    }
    return content;
  }

  /**
   * Get recent public events for a user (activity across GitHub)
   */
  async getUserEvents(username: string, perPage: number = 100): Promise<Array<{
    type: string;
    repo?: { name?: string };
    payload?: Record<string, string | number | Array<Record<string, string | number>>>;
    created_at: string;
  }>> {
    const octokit = await this.getOctokit();
    
    try {
      // Retry logic for activity endpoint
      let response;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          response = await octokit.request<Array<{
            type: string;
            repo?: { name?: string };
            payload?: Record<string, string | number | Array<Record<string, string | number>>>;
            created_at: string;
          }>>('GET /users/{username}/events/public', {
            username,
            per_page: perPage
          });
          break; // Success, exit retry loop
        } catch (error: unknown) {
          retries++;
          if (retries >= maxRetries) {
            throw error; // Give up after max retries
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
        }
      }

      // Check if response is defined
      if (!response) {
        throw new Error('Failed to get response after retries');
      }

      // Filter for contribution-related events
      const contributionEvents = response.data.filter((event) => {
        return [
          'PushEvent',           // Code pushes
          'PullRequestEvent',    // Pull request creation/updates  
          'IssuesEvent',         // Issue creation/comments
          'IssueCommentEvent',   // Issue comments
          'PullRequestReviewEvent', // PR reviews
          'PullRequestReviewCommentEvent', // PR review comments
          'CreateEvent',         // Repository/branch creation
          'ForkEvent',           // Repository forks
          'CommitCommentEvent'   // Commit comments
        ].includes(event.type);
      });

      return contributionEvents;
      
    } catch (error) {
      console.error(`Error fetching events for ${username}:`, error);
      return [];
    }
  }
}

export default GitHubAPI;