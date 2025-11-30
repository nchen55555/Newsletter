import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Top-K Repository Similarity Matching
export async function POST(request: NextRequest) {
  try {
    const { querySubscriberId, topK = 5 } = await request.json();
    
    if (!querySubscriberId) {
      return NextResponse.json({ error: 'Query subscriber ID is required' }, { status: 400 });
    }

    // Check for service role key in authorization header
    const authHeader = request.headers.get('authorization');
    let supabase;
    
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
      supabase = createRouteHandlerClient({ cookies });
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ 
          error: 'Authentication required' 
        }, { status: 401 });
      }
    }

    // Get all repositories for the query user
    const { data: queryUserRepos, error: queryError } = await supabase
      .from('github_repository_embeddings')
      .select('*')
      .eq('subscriber_id', querySubscriberId);

    if (queryError) {
      return NextResponse.json({ 
        error: 'Failed to fetch user repositories',
        details: queryError.message 
      }, { status: 500 });
    }

    if (!queryUserRepos || queryUserRepos.length === 0) {
      return NextResponse.json({ 
        error: 'No repositories found for user',
        matches: []
      });
    }

    console.log(`[SIMILARITY] Found ${queryUserRepos.length} repositories for subscriber ${querySubscriberId}`);

    const candidateScores = new Map();
    
    // For each repository of the query user, find similar repositories
    for (const queryRepo of queryUserRepos) {
      console.log(`[SIMILARITY] Finding matches for repository: ${queryRepo.repository_name}`);
      
      // Find most similar repositories across ALL other users using pgvector
      const { data: similarRepos, error: similarityError } = await supabase
        .rpc('find_similar_repositories', {
          query_embedding: queryRepo.embedding,
          exclude_subscriber_id: querySubscriberId,
          match_count: 3 // Top 3 matches per repository
        });

      if (similarityError) {
        console.error(`Error finding similar repositories for ${queryRepo.repository_name}:`, similarityError);
        continue;
      }

      // Aggregate scores per user
      for (const match of similarRepos || []) {
        const currentScore = candidateScores.get(match.subscriber_id) || { totalSimilarity: 0, matchedRepos: [] };
        currentScore.totalSimilarity += match.similarity;
        currentScore.matchedRepos.push({
          queryRepo: queryRepo.repository_name,
          matchedRepo: match.repository_name,
          similarity: match.similarity
        });
        candidateScores.set(match.subscriber_id, currentScore);
      }
    }

    // Get top candidates by total similarity score
    const topCandidates = Array.from(candidateScores.entries())
      .sort(([, a], [, b]) => b.totalSimilarity - a.totalSimilarity)
      .slice(0, topK);

    // Fetch user metadata for top candidates
    const candidateIds = topCandidates.map(([subscriberId]) => subscriberId);
    
    const { data: candidateUsers, error: usersError } = await supabase
      .from('subscribers')
      .select('id, first_name, last_name, email, profile_image_url, embedding_metadata')
      .in('id', candidateIds);

    if (usersError) {
      console.error('Error fetching candidate users:', usersError);
    }

    // Combine scores with user metadata
    const results = topCandidates.map(([subscriberId, scoreData]) => {
      const user = candidateUsers?.find(u => u.id === subscriberId);
      return {
        subscriberId,
        totalSimilarity: scoreData.totalSimilarity,
        matchedRepositories: scoreData.matchedRepos.length,
        repositoryMatches: scoreData.matchedRepos,
        user: user ? {
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          username: user.embedding_metadata?.username,
          avatar_url: user.profile_image_url
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      querySubscriberId,
      queryRepositoryCount: queryUserRepos.length,
      queryUserRepositories: queryUserRepos.map(repo => ({
        repository_name: repo.repository_name,
        file_count: repo.file_count,
        contribution_type: repo.contribution_type,
        technologies: repo.technologies,
        assessment: repo.assessment,
        summary: repo.summary,
        updated_at: repo.updated_at,
        embedding: repo.embedding,
      })),
      topK,
      matches: results
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error computing repository similarity:', error);
    return NextResponse.json({ 
      error: 'Failed to compute repository similarity',
      details: err.message || 'Unknown error'
    }, { status: 500 });
  }
}