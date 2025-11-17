import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  CandidateMatch,
  SkillScores,
} from '@/app/types/match-types';

// Type alias for backward compatibility
type EnrichedCandidateMatch = CandidateMatch;

interface MatchRequest {
  matches: Array<{
    candidate_id: string;
    distance: number;
    similarity: number;
    similarity_percentage: number;
    skills: SkillScores;
    skill_differences: SkillScores;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Parse request body
    const body: MatchRequest = await request.json();
    const { matches } = body;

    // Validate required fields
    if (!matches || !Array.isArray(matches)) {
      return NextResponse.json({ 
        success: false,
        error: 'matches array is required'
      }, { status: 400 });
    }

    // Extract candidate IDs from matches
    const candidateIds = matches.map(match => parseInt(match.candidate_id)).filter(id => !isNaN(id));
    
    // Fetch matched candidate info from Supabase if we have candidate IDs
    let candidates: Array<{ id: number; first_name: string; last_name: string; profile_image_url?: string; github_vector_embeddings?: number[] }> = [];
    if (candidateIds.length > 0) {
      const { data: candidateData, error: fetchError } = await supabase
        .from('subscribers')
        .select('id, first_name, last_name, profile_image_url, github_vector_embeddings')
        .in('id', candidateIds);

      if (fetchError) {
        console.error('Error fetching candidates:', fetchError);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to fetch candidate profiles'
        }, { status: 500 });
      }
      
      candidates = candidateData || [];
    }

    // Combine candidate data with similarity scores
    const enrichedMatches: EnrichedCandidateMatch[] = matches.map(match => {
      const candidateProfile = candidates?.find(c => c.id.toString() === match.candidate_id);
      
      if (!candidateProfile) {
        return {
          ...match,
          profile: undefined,
          error: 'Profile not found'
        };
      }

      // Parse GitHub vector embeddings if they're stored as string
      let parsedEmbeddings = candidateProfile.github_vector_embeddings;
      if (typeof candidateProfile.github_vector_embeddings === 'string') {
        try {
          parsedEmbeddings = JSON.parse(candidateProfile.github_vector_embeddings);
        } catch (e) {
          parsedEmbeddings = undefined;
          console.log("Error ", e)
        }
      }

      return {
        ...match,
        profile: {
          id: candidateProfile.id,
          first_name: candidateProfile.first_name,
          last_name: candidateProfile.last_name,
          profile_image_url: candidateProfile.profile_image_url
        },
        github_vector_embeddings: parsedEmbeddings
      };
    });

    // Filter out any matches where profile wasn't found
    const validMatches = enrichedMatches.filter(match => match.profile !== null);

    // Generate summary statistics
    const summary = matches.length > 0 ? {
      total_matches: matches.length,
      profiles_found: validMatches.length,
      average_similarity: matches.reduce((sum, match) => sum + match.similarity_percentage, 0) / matches.length,
      best_match_similarity: Math.max(...matches.map(m => m.similarity_percentage))
    } : {
      total_matches: 0,
      profiles_found: 0,
      average_similarity: 0,
      best_match_similarity: 0
    };

    return NextResponse.json({
      success: true,
      matches: validMatches,
      summary,
      metadata: {
        timestamp: new Date().toISOString(),
        total_processed_matches: matches.length
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Unexpected error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports POST requests'
  }, { status: 405 });
}