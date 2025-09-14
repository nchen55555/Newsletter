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

  const { data, error } = await supabase
    .from('subscribers')
    .select('id, email, first_name, last_name')
    .eq('status', 'COHORT')

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch cohort profiles',
      details: error.message,
    }, { status: 500 });
  }

  return NextResponse.json({profiles : data });
}

    