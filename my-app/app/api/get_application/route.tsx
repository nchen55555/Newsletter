import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: NextRequest) {
    const cookieStore = cookies();
    try{
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { searchParams } = new URL(req.url);
        const candidate_id = searchParams.get('candidate_id');
        const company_id = searchParams.get('company_id');

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }


        const { data: existing, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('candidate_id', candidate_id)
        .eq('company_id', company_id)


      
      if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows" error
          return NextResponse.json({ error: 'Failed to check application', details: fetchError.message }, { status: 500 });
      }

        return NextResponse.json({ existing: existing });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Unexpected error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
        }
    
}