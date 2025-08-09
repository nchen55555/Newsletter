import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(){
    try{
        const supabase = createRouteHandlerClient({ cookies })
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        const accessToken = session?.access_token;
        if (sessionError) throw sessionError
        if (!session?.user?.email) {
          return NextResponse.json({ isSubscribed: false })
        }
        // Check if email exists in subscribers table
        const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', session.user.email)
        .single();
    
        if (subError) throw subError

        return NextResponse.json({ 
            isSubscribed: subscriber !== null,
            id: subscriber?.id,
            email: subscriber?.email,
            linkedin_url: subscriber?.linkedin_url, 
            resume_url: subscriber?.resume_url,
            personal_website: subscriber?.personal_website,
            bio: subscriber?.bio,
            phone_number: subscriber?.phone_number,
            first_name: subscriber?.first_name,
            last_name: subscriber?.last_name, 
            profile_image_url: subscriber?.profile_image_url,
            access_token: accessToken
        })

    } catch (error) {
    console.error('Error checking profile:', error)
    return NextResponse.json(
        { error: 'Error checking profile' },
        { status: 500 }
    )
    }
}
