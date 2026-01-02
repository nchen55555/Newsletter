import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface BatchAnalysisResult {
  subscriberId: number;
  username: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  repositoriesAnalyzed?: number;
  embeddingGenerated?: boolean;
  repositoryEmbeddingsGenerated?: number;
}

interface BatchAnalysisResponse {
  success: boolean;
  processed: number;
  errors: number;
  skipped: number;
  results: BatchAnalysisResult[];
  summary: {
    totalRepositories: number;
    totalRepositoryEmbeddings: number;
    embeddingsGenerated: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check for service role key in authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Service role authentication required' 
      }, { status: 401 });
    }

    const serviceKey = authHeader.replace('Bearer ', '');
    
    // Validate service key by trying to create client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Invalid JSON in request body:', jsonError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : String(jsonError)
      }, { status: 400 });
    }

    const { 
      limit = null, 
      skipExisting = false, 
      maxConcurrent = 5,
      dryRun = false 
    } = body;

    // Get subscribers with GitHub URLs
    let query = supabase
      .from('subscribers')
      .select(`
        id, 
        github_url, 
        first_name, 
        last_name, 
        embedding_metadata
      `)
      .not('github_url', 'is', null)
      .neq('github_url', '');

    if (skipExisting) {
      // Get users who DON'T have embeddings by using NOT IN with a subquery
      // First get all user IDs that have repository embeddings
      const { data: usersWithEmbeddings } = await supabase
        .from('github_repository_embeddings')
        .select('subscriber_id');
      
      const userIdsWithEmbeddings = (usersWithEmbeddings || []).map(row => row.subscriber_id);
      
      if (userIdsWithEmbeddings.length > 0) {
        query = query.not('id', 'in', `(${userIdsWithEmbeddings.join(',')})`);
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: subscribers, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscribers',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        errors: 0,
        skipped: 0,
        results: [],
        summary: { totalRepositories: 0, totalRepositoryEmbeddings: 0, embeddingsGenerated: 0 }
      });
    }

    const results: BatchAnalysisResult[] = [];
    let processed = 0;
    let errors = 0;
    let skipped = 0;
    let totalRepositories = 0;
    let totalRepositoryEmbeddings = 0;
    let embeddingsGenerated = 0;

    // Helper function to extract GitHub username from URL
    const extractGitHubUsername = (githubUrl: string): string | null => {
      if (!githubUrl) return null;
      
      const patterns = [
        /https?:\/\/github\.com\/([^\/\?]+)/i,
        /github\.com\/([^\/\?]+)/i,
        /^([^\/\?]+)$/  // Just username
      ];
      
      for (const pattern of patterns) {
        const match = githubUrl.match(pattern);
        if (match) {
          const username = match[1].trim();
          // Filter out common non-username paths
          if (!['orgs', 'organizations', 'explore', 'settings', 'notifications'].includes(username.toLowerCase())) {
            return username;
          }
        }
      }
      
      return null;
    };

    // Process with semaphore for concurrency control
    let activeRequests = 0;
    const maxConcurrentRequests = maxConcurrent;

    interface Subscriber {
      id: number;
      github_url: string;
      first_name?: string | null;
      last_name?: string | null;
      // Add any other properties you expect from the subscriber object
      [key: string]: string | number | boolean | null | undefined;
    }

    const processSubscriber = async (subscriber: Subscriber): Promise<BatchAnalysisResult> => {
      // Wait for available slot
      while (activeRequests >= maxConcurrentRequests) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      activeRequests++;

      try {
        const username = extractGitHubUsername(subscriber.github_url);
        
        if (!username) {
          skipped++;
          return {
            subscriberId: subscriber.id,
            username: 'N/A',
            status: 'skipped',
            error: 'No valid GitHub username found'
          };
        }

        // Skip check is now handled in the query above, so we don't need to check again here
        // All subscribers returned by the query should be eligible for processing

        if (dryRun) {
          processed++;
          return {
            subscriberId: subscriber.id,
            username,
            status: 'success',
            repositoriesAnalyzed: 0,
            embeddingGenerated: false
          };
        }

        try {
          // Call the existing analyze-github-profile endpoint
          const isLocal = process.env.NODE_ENV === 'development';
          const baseUrl = isLocal 
            ? 'http://localhost:3000'
            : (process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://theniche.tech');

          const payload = {
            username,
            store_to_user: true,
            id: subscriber.id,
            first_name: subscriber.first_name,
            last_name: subscriber.last_name
          };

          const response = await fetch(`${baseUrl}/api/analyze-github-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authorization': authHeader
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (response.ok && result.success) {
            processed++;
            const repoCount = result.data?.repositoryGroups?.length || 0;
            totalRepositories += repoCount;
            
            // Count repository embeddings generated (this would be set by the github_embedding route)
            const repoEmbeddingsCount = result.repositoryEmbeddingsGenerated || 0;
            totalRepositoryEmbeddings += repoEmbeddingsCount;
            
            if (result.embeddingGenerated) {
              embeddingsGenerated++;
            }
            
            return {
              subscriberId: subscriber.id,
              username,
              status: 'success',
              repositoriesAnalyzed: repoCount,
              embeddingGenerated: result.embeddingGenerated,
              repositoryEmbeddingsGenerated: repoEmbeddingsCount
            };
          } else {
            errors++;
            
            return {
              subscriberId: subscriber.id,
              username,
              status: 'error',
              error: result.error || `HTTP ${response.status}`
            };
          }
        } catch (error) {
          errors++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          return {
            subscriberId: subscriber.id,
            username,
            status: 'error',
            error: errorMsg
          };
        }
      } finally {
        activeRequests--;
      }
    };

    // Process all subscribers
    const tasks = subscribers.map(subscriber => processSubscriber(subscriber));
    const allResults = await Promise.all(tasks);
    results.push(...allResults);

    const response: BatchAnalysisResponse = {
      success: true,
      processed,
      errors,
      skipped,
      results,
      summary: {
        totalRepositories,
        totalRepositoryEmbeddings,
        embeddingsGenerated
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in batch GitHub analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to process batch GitHub analysis',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports POST requests',
    usage: {
      method: 'POST',
      headers: {
        'authorization': 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
      },
      body: {
        limit: 'number (optional) - max subscribers to process',
        skipExisting: 'boolean (optional) - skip users with existing repository embeddings',
        maxConcurrent: 'number (optional) - max concurrent API calls (default: 5)',
        dryRun: 'boolean (optional) - preview without making changes'
      },
      examples: {
        basic: { limit: 10, skipExisting: true },
        dryRun: { limit: 5, dryRun: true },
        production: { skipExisting: true, maxConcurrent: 3 }
      }
    }
  }, { status: 405 });
}