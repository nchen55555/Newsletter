import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userEmail = session?.user?.email;

  const { data, error: fetchError } = await supabase
    .from('subscribers')
    .select('bookmarked_companies')
    .eq('email', userEmail)
    .single();

  if (fetchError) {
    return NextResponse.json({
      error: 'Failed to fetch bookmarks',
      details: fetchError.message,
    }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data?.bookmarked_companies ?? [] });
}
