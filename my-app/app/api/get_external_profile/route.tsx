import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { decodeSimple } from '../../utils/simple-hash'

export async function GET(request: Request){
    try{
        const supabase = createRouteHandlerClient({ cookies })

        
        // Get user ID from URL search params
        const { searchParams } = new URL(request.url)
        const hashId = searchParams.get('id')
        
        if (!hashId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Decode the hash to get the real database ID
        let realId: number | null = null;
        
        // Try decoding as a simple hash first (e.g., "1861" → 123)
        realId = decodeSimple(hashId);
        console.log("Decoded simple hash:", hashId, "→", realId);
        
        // If decoding failed, try parsing as direct integer (fallback)
        if (!realId && !isNaN(parseInt(hashId))) {
          realId = parseInt(hashId);
          console.log("Using direct integer:", hashId, "→", realId);
        }
        
        if (!realId) {
          return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
        }

        // Fetch subscriber by real ID from subscribers table
        const { data: subscriber, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('id', realId)
        .single();
    
        
        
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
            status: subscriber?.status,
            transcript_url: subscriber?.transcript_url,
            applied: subscriber?.applied,
            parsed_resume_json: subscriber?.parsed_resume_json,
        })

    } catch (error) {
    console.error('Error checking profile:', error)
    return NextResponse.json(
        { error: 'Error checking profile' },
        { status: 500 }
    )
    }
}
