import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(){
    try{
        const supabase = createRouteHandlerClient({ cookies })
        console.log("current session")
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        const accessToken = session?.access_token;
        console.log("access token", accessToken)
        console.log("awaiting session")
        if (sessionError) throw sessionError
        console.log("session", session)
        if (!session?.user?.email) {
            console.log("not subscribed")
          return NextResponse.json({ isSubscribed: false })
        }
        console.log("after current session")
        // Check if email exists in subscribers table
        const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', session.user.email)
        .single();

        console.log("Subscriber ", subscriber)
    
        if (subError) throw subError

        console.log("Subscriber ", subscriber)

        return NextResponse.json({ 
            isSubscribed: subscriber !== null,
            id: subscriber?.id,
            email: subscriber?.email,
            linkedin_url: subscriber?.linkedin_url, 
            resume_url: subscriber?.resume_url,
            personal_website: subscriber?.personal_website,
            phone_number: subscriber?.phone_number,
            first_name: subscriber?.first_name,
            last_name: subscriber?.last_name, 
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
