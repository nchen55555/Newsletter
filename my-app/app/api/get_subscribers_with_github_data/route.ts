import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const skipExisting = url.searchParams.get('skip_existing') === 'true';
    
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
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ 
          error: 'Authentication required' 
        }, { status: 401 });
      }
    }

    // Build query to get subscribers with github_url_data
    let query = supabase
      .from('subscribers')
      .select('id, first_name, last_name, github_url, github_url_data, github_vector_embeddings')
      .not('github_url_data', 'is', null);
    
    // Skip those who already have embeddings if requested
    if (skipExisting) {
      query = query.is('github_vector_embeddings', null);
    }
    
    // Add limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: subscribers, error } = await query;

    if (error) {
      console.error('Error fetching subscribers with GitHub data:', error);
      return NextResponse.json({
        error: 'Failed to fetch subscribers',
        details: error.message
      }, { status: 500 });
    }

    console.log(`Fetched ${subscribers?.length || 0} subscribers with GitHub data`);

    return NextResponse.json({
      success: true,
      subscribers: subscribers || [],
      total: subscribers?.length || 0
    });

  } catch (error) {
    console.error('Error in get_subscribers_with_github_data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}