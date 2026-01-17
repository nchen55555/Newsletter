import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();

  try {
    // 1. Create Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Parse JSON body
    const body = await req.json();
    const {
      companyName,
      email,
      roles
    } = body;

    if (!companyName || !email || !roles) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Insert hiring interest into database
    const { error: dbError } = await supabase
      .from('hiring_interest')
      .insert({
        company_name: companyName,
        contact_email: email,
        roles: roles,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Hiring interest insert error', dbError);
      return NextResponse.json({
        error: 'Failed to submit hiring interest',
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

export async function PATCH(req: NextRequest) {
  return POST(req);
}
