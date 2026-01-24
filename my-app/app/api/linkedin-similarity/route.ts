import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Find similar users using the RPC function
    const { data: similarUsers, error: similarityError } = await supabase
      .rpc('find_similar_linkedin_profiles', {
        current_user_id: parseInt(userId),
        match_count: limit
      });

    if (similarityError) {
      console.error('Similarity search error:', similarityError);
      return NextResponse.json({
        error: 'Failed to find similar users',
        details: similarityError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      similarUsers: similarUsers || []
    });

  } catch (error) {
    console.error('LinkedIn similarity API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
