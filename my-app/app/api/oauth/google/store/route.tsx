import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    try{
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });        

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('Auth error:', userError);
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { provider_refresh_token } = await req.json()
        if (!provider_refresh_token) {
            console.error('Missing refresh token in request');
            return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 })
        }

        console.log('Attempting to store refresh token for user:', user.id);
        
        const { data, error } = await supabase.from('user_google_credentials').upsert({
            user_id: user.id,
            google_refresh_token: provider_refresh_token,
            updated_at: new Date().toISOString(),
        })

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        console.log('Successfully stored refresh token:', data);
        return NextResponse.json({ ok: true })
        

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Unexpected error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
}