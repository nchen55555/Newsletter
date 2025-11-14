import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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
      console.log('Using service role client for batch processing');
    } else {
      // Fallback to regular authenticated client
      supabase = createRouteHandlerClient({ cookies });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const skipExistingParam = searchParams.get('skip_existing');
    
    const limit = limitParam ? parseInt(limitParam) : null;
    const skipExisting = skipExistingParam === 'true';
    
    // Build the query to find subscribers with GitHub URLs
    let query = supabase
      .from('subscribers')
      .select('id, email, first_name, last_name, github_url, github_url_data, github_vector_embeddings')
      .not('github_url', 'is', null)
      .neq('github_url', '');
    
    // Skip those who already have embeddings if requested
    if (skipExisting) {
      query = query.is('github_vector_embeddings', null);
    }
    
    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: subscribers, error } = await query;
    
    if (error) {
      console.error('Error fetching subscribers with GitHub URLs:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch subscribers with GitHub URLs',
        details: error.message
      }, { status: 500 });
    }
    
    const enrichedSubscribers = (subscribers || []).map(subscriber => ({
      ...subscriber,
      has_github_data: !!subscriber.github_url_data,
      has_embeddings: !!subscriber.github_vector_embeddings
    }));
    
    return NextResponse.json({
      success: true,
      subscribers: enrichedSubscribers,
      metadata: {
        total_found: enrichedSubscribers.length,
        with_existing_data: enrichedSubscribers.filter(s => s.has_github_data).length,
        with_existing_embeddings: enrichedSubscribers.filter(s => s.has_embeddings).length,
        query_params: {
          limit,
          skip_existing: skipExisting
        }
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in get_subscribers_with_github:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
}