import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const resolvedParams = await params;
    const companyId = parseInt(resolvedParams.id);

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
    }

    // Get the current user's profile to check their connections
    const { data: currentUser, error: userError } = await supabase
      .from('subscribers')
      .select('id, connections_new')
      .eq('email', session.user.email)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userConnections = currentUser.connections_new || [];
    
    // Extract IDs from connection objects if using new format
    const connectionIds = Array.isArray(userConnections) && userConnections.length > 0 && typeof userConnections[0] === 'object'
      ? userConnections.map((conn: {connect_id: number, rating: number}) => conn.connect_id)
      : userConnections;

    if (userConnections.length === 0) {
      return NextResponse.json([]);
    }

    // Find users who bookmarked this company or have it in recommendations and are in the current user's network
    const { data: bookmarkedUsers, error: bookmarkedUsersError } = await supabase
      .from('subscribers')
      .select('id, first_name, last_name, profile_image_url, linkedin_url, bio')
      .or(`bookmarked_companies.cs.{${companyId}},company_recommendations.cs.{${companyId}}`)
      .in('id', connectionIds)
      .eq('is_public_profile', true)
      .order('first_name')
      .order('last_name');

    if (bookmarkedUsersError) {
      console.error('Error fetching bookmarked users:', bookmarkedUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch bookmarked users' },
        { status: 500 }
      );
    }

    return NextResponse.json(bookmarkedUsers || []);

  } catch (error) {
    console.error('Error fetching bookmarked users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}