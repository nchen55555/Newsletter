import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {

    const { profile_layout_config } = await req.json();
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userEmail = session?.user?.email;

    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ profile_layout_config: profile_layout_config })
      .eq('email', userEmail);

    if (updateError) {
      console.error('Profile Layout Config update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile layout config', 
        details: updateError.message 
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

export async function GET() {
  
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      const userEmail = session?.user?.email;
  
      const { data, error: fetchError } = await supabase
        .from('subscribers')
        .select('profile_layout_config')
        .eq('email', userEmail)
        .single()
  
      if (fetchError) {
        console.error('Profile Layout Config select error:', fetchError);
        return NextResponse.json({ 
          error: 'Failed to select config', 
          details: fetchError.message 
        }, { status: 500 });
      }
  
      return NextResponse.json({ success: true, profile_layout_config: data.profile_layout_config });
  
    } catch (error) {
      console.error('Unexpected error:', error);
      return NextResponse.json({ 
        error: 'Unexpected error occurred', 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 });
    }
  }