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

        // Validate that the user actually exists in Supabase Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          // User doesn't exist in auth anymore, clear the session
          await supabase.auth.signOut()
          return NextResponse.json({ isSubscribed: false })
        }
        // Check if email exists in subscribers table
        const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', session.user.email)
        .single();
    
        // If no subscriber found (deleted account), return not subscribed
        if (subError && subError.code === 'PGRST116') {
          return NextResponse.json({ isSubscribed: false })
        }
        
        // For other errors, throw them
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
            is_public_profile: subscriber?.is_public_profile,
            newsletter_opt_in: subscriber?.newsletter_opt_in,
            access_token: accessToken,
            status: subscriber?.status,
            transcript_url: subscriber?.transcript_url,
            applied: subscriber?.applied,
            parsed_resume_json: subscriber?.parsed_resume_json,
            generated_interest_profile: subscriber?.generated_interest_profile,
            opportunities_looking_for: subscriber?.opportunities_looking_for,
            company_recommendations: subscriber?.company_recommendations,
            interests: subscriber?.interests,
            connections: subscriber?.connections,
            connections_new: subscriber?.connections_new,
            application_tracker_confirmed: subscriber?.application_tracker_confirmed,
            pending_connections: subscriber?.pending_connections,
            pending_connections_new: subscriber?.pending_connections_new,
            school: subscriber?.school,
            requested_connections: subscriber?.requested_connections,
            requested_connections_new: subscriber?.requested_connections_new,
            needs_visa_sponsorship: subscriber?.needs_visa_sponsorship,
            bookmarked_companies: subscriber?.bookmarked_companies,
            network_recommendations: subscriber?.network_recommendations, 
            onboarding_step: subscriber?.onboarding_step, 
            professional_agreement: subscriber?.professional_agreement || false,
            interview_status_updated_at: subscriber?.interview_status_updated_at,
            check_in_status: subscriber?.check_in_status,
            timeline_of_search: subscriber?.timeline_of_search,
            outreach_frequency: subscriber?.outreach_frequency, 
            github_url: subscriber?.github_url,
            custom_links: subscriber?.custom_links,
            visibility_profile_settings: subscriber?.visibility_profile_settings,
        })

    } catch (error) {
    console.error('Error checking profile:', error)
    return NextResponse.json(
        { error: 'Error checking profile' },
        { status: 500 }
    )
    }
}
