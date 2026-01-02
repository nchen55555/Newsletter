import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import GitHubProfileAnalyzer from '@/app/lib/github-profile-analyzer';
import type { GitHubProfileAnalysis } from '@/app/types/github-analysis';

// JSON-like type used for sanitized analysis payloads
type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONValue = JSONPrimitive | JSONArray | JSONObject | GitHubProfileAnalysis;

// Helper function to sanitize data by removing null bytes and problematic characters
function sanitizeAnalysisData(obj: JSONValue): JSONValue {
  if (typeof obj === 'string') {
    // Remove null bytes and other problematic Unicode characters
    return obj
      .replace(/\u0000/g, '')
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  }

  if (Array.isArray(obj)) {
    return (obj as JSONArray).map(sanitizeAnalysisData);
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned: JSONObject = {};
    for (const [key, value] of Object.entries(obj as JSONObject)) {
      cleaned[key] = sanitizeAnalysisData(value);
    }
    return cleaned;
  }

  return obj;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, store_to_user, id, first_name, last_name } = body;

    // Validate required fields
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ 
        error: 'GitHub username is required' 
      }, { status: 400 });
    }

    // Initialize Supabase client if we need to store the data
    let supabase = null;    
    if (store_to_user) {
      // Check for service role key in authorization header
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const serviceKey = authHeader.replace('Bearer ', '');
        
        // Use service role client (bypasses RLS)
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey
        );
      } else {
        // Fallback to regular authenticated client
        const cookieStore = cookies();
        supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        
        // Get authenticated user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          return NextResponse.json({ 
            error: 'Authentication required to store analysis data' 
          }, { status: 401 });
        }
        // user = authUser; // Removing unused variable
      }
    }

    // Check for required environment variables
    const githubAppId = process.env.GITHUB_APP_ID;
    const githubPrivateKey = process.env.GITHUB_PRIVATE_KEY;
    const githubInstallationId = process.env.GITHUB_INSTALLATION_ID;
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMENI_API_KEY;

    if (!githubAppId || !githubPrivateKey || !githubInstallationId) {
      return NextResponse.json({ 
        error: 'GitHub App not configured. Please set GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_INSTALLATION_ID environment variables.' 
      }, { status: 500 });
    }

    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured. Please set NEXT_PUBLIC_GEMENI_API_KEY environment variable.' 
      }, { status: 500 });
    }

    // Initialize the analyzer
    const analyzer = new GitHubProfileAnalyzer(githubAppId, githubPrivateKey, geminiApiKey);

    // Get user's real name from parameters for better commit verification
    let userRealName: string | undefined;
    if (first_name || last_name) {
      userRealName = [first_name, last_name].filter(Boolean).join(' ');
    }

    // Perform the analysis with user's real name for better commit verification
    const analysis = await analyzer.analyzeProfile(username, userRealName);

    // Clean the analysis data to remove null bytes and other problematic characters
    const cleanedAnalysis = sanitizeAnalysisData(analysis);

    // Track if embeddings were generated during this analysis
    let embeddingGenerated = false;

    // Store to Supabase if requested and we have a supabase client
    if (store_to_user && supabase && id) {
      try {
        
        // Update the subscribers table with github_url_data
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({ 
            github_url_data: cleanedAnalysis 
          })
          .eq('id', id);

        if (updateError) {
          console.error('Error storing GitHub analysis:', updateError);
          // Don't fail the request, just log the error
        } else {
          
          // Generate embeddings after successfully storing analysis data
          let embeddingSuccess = false;
          try {
            const embeddingHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            
            // Pass service role header if we have it
            const requestAuthHeader = request.headers.get('authorization');
            if (requestAuthHeader && requestAuthHeader.startsWith('Bearer ')) {
              embeddingHeaders['authorization'] = requestAuthHeader;
            }
            
            const embeddingResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/github_embedding`, {
              method: 'POST',
              headers: embeddingHeaders,
              body: JSON.stringify({
                data: cleanedAnalysis,
                subscriberId: id
              })
            });

            if (!embeddingResponse.ok) {
              console.error('Failed to generate GitHub embeddings:', await embeddingResponse.text());
            } else {
              const embeddingResult = await embeddingResponse.json();
              
              // Signal that embeddings were generated for similarity recalculation
              if (embeddingResult.embeddingGenerated) {
                embeddingSuccess = true;
              }
            }
          } catch (embeddingError) {
            console.error('Error generating GitHub embeddings:', embeddingError);
            // Don't fail the request, just log the error
          }
          
          // Store the embedding success status for the response
          embeddingGenerated = embeddingSuccess;
        }
      } catch (storageError) {
        console.error('Error storing GitHub analysis:', storageError);
        // Don't fail the request, just log the error
      }
    }

    // Clean the analysis data to avoid circular structure issues
    const cleanAnalysis = {
      username: analysis.username,
      totalRepositories: analysis.totalRepositories,
      contributionSummary: analysis.contributionSummary ? {
        totalActivities: analysis.contributionSummary.totalActivities || 0,
        openSourceContributions: analysis.contributionSummary.openSourceContributions || 0,
        contributionsByType: analysis.contributionSummary.contributionsByType || {},
        activeRepositories: analysis.contributionSummary.activeRepositories || []
      } : {
        totalActivities: 0,
        openSourceContributions: 0,
        contributionsByType: {},
        activeRepositories: []
      },
      repositoryGroups: analysis.repositoryGroups || [],
      analysisDate: analysis.analysisDate
    };

    return NextResponse.json({
      success: true,
      data: cleanAnalysis,
      stored: store_to_user && !!supabase,
      embeddingGenerated // Signal to frontend that embeddings are now available
    });

  } catch (error) {
    console.error('Error analyzing GitHub profile:', error);
    
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'GitHub API rate limit exceeded. Please try again later.',
        details: error.message
      }, { status: 429 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ 
        error: 'GitHub user not found or has no public repositories.',
        details: error.message
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Failed to analyze GitHub profile', 
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
      body: {
        username: 'GitHub username to analyze (e.g., "octocat")',
        store_to_user: 'boolean (optional) - whether to store analysis in user\'s Supabase profile'
      },
      examples: {
        basic: { username: 'torvalds' },
        withStorage: { username: 'torvalds', store_to_user: true }
      }
    }
  }, { status: 405 });
}