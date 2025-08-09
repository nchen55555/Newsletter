import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    try{
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { candidate_id, company_id, additional_info } = await req.json();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { error: dbError } = await supabase
        .from('applications')
        .insert({
            candidate_id: candidate_id,
            company_id: company_id,
            additional_info: additional_info
        })
        .single();

        if (dbError) {
            console.error('Application creation error:', dbError);
            return NextResponse.json({ 
                error: 'Failed to create application', 
                details: dbError.message 
            }, { status: 500 });
        }

        return NextResponse.json({ success: true});

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Unexpected error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
        }
    
}