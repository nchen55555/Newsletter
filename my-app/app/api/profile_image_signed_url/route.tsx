import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  // If a Bearer token is provided, assume it's the SERVICE ROLE key.
  if (bearer) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      bearer // service role key
    );
    const filePath = '3fc9d6b8-f51c-46d5-b443-1464e8e4e9de/profile_image.jpg'; // hard-coded
    const { data, error } = await supabase
      .storage
      .from('profile_image_files')
      .createSignedUploadUrl(filePath);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ signedUrl: data.signedUrl, path: filePath });
  }

  // Otherwise, use the logged-in user's cookie session
  const supabaseByCookies = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabaseByCookies.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const filePath = `${user.id}/profile_image.jpg`;
  const { data, error } = await supabaseByCookies
    .storage
    .from('profile_image_files')
    .createSignedUploadUrl(filePath);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ signedUrl: data.signedUrl, path: filePath });
}
