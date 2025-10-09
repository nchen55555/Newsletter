import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  // Await cookies() before using
  const cookieStore = cookies();

  try {
    // 1. Create Supabase client using route handler with awaited cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Authenticate the user (use await)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 3. Parse JSON body
    const body = await req.json();
    const { 
      subscriber_id, 
      company_id, 
      feed_id,
      content, 
      rating
    } = body;


    // 6. Update subscriber profile with step 3 data
    const { error: dbError } = await supabase
      .from('feed')
      .insert({ subscriber_id: subscriber_id, company_id: company_id, feed_id: feed_id, content: content, audience_rating: rating, })
      .eq('email', user.email);

    if (dbError) {
      console.error('Could not post thread:', dbError);
      return NextResponse.json({ 
        error: 'Failed to post thread', 
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({success: true})

  } catch (error) {
    console.error('Unexpected error in post_step3:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}