import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function PATCH(req: NextRequest) {
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

    // 3. Parse form data
    const formData = await req.formData();

    const { error: dbError } = await supabase
      .from('subscribers')
      .update({
        evaluation_url: formData.get('evaluation_url'),
        status: formData.get('status'),
      })
      .eq('id', Number(formData.get('id')))
      .eq('email', formData.get('email'));

    console.log('Profile updated successfully');

    if (dbError) {
      console.error('Profile update error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}