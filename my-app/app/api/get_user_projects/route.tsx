import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get user_id from query parameters
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
  }

  // Get project URLs for the specific user
  const { data, error } = await supabase
    .from('subscribers')
    .select(`
      project_urls
    `)
    .eq('id', userId)

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch user projects',
      details: error.message,
    }, { status: 500 });
  }

    return NextResponse.json({
      project_urls: data?.[0]?.project_urls || [],
    });
}