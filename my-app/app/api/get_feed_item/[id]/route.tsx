import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id: feedId } = await params;

  try {
    // Get the specific feed item with author information
    const { data, error } = await supabase
      .from('feed')
      .select(`
        id,
        created_at,
        content,
        subscriber_id,
        subscribers!inner (
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('id', feedId)
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch feed item',
        details: error.message,
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Feed item not found' }, { status: 404 });
    }

    // Format the response
    const author = Array.isArray(data.subscribers) ? data.subscribers[0] : data.subscribers;
    const formattedFeed = {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
      author_name: `${author.first_name} ${author.last_name}`.trim(),
      author_image: author.profile_image_url
    };

    return NextResponse.json(formattedFeed);
  } catch (error) {
    console.error('Error fetching feed item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}