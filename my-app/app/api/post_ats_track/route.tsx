import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST() {
  const cookieStore = cookies();
  
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Update the application_tracker_confirmed field
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ application_tracker_confirmed: true })
      .eq('email', user.email);

    if (updateError) {
      console.error('Error updating application tracker confirmation:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update application tracker confirmation',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application tracker confirmation updated successfully' 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}