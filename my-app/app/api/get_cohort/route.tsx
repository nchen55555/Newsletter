import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Check session, but don't block unauthenticated users – we just return less data
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const selectFields = session
    ? 'id, email, linkedin_url, phone_number, personal_website, first_name, last_name, profile_image_url, bio, school'
    : 'first_name, last_name, profile_image_url';

  const { data, error } = await supabase
    .from('subscribers')
    .select(selectFields)
    .eq('applied', 'TRUE');


  if (error) {
    console.log(error.message);
    return NextResponse.json({
      error: 'Failed to fetch cohort profiles',
      details: error.message,
    }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
}

    