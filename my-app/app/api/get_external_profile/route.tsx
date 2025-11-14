import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { decodeSimple, decodeWithClient } from '../../utils/simple-hash'

export async function GET(request: Request){
    try{
        const supabase = createRouteHandlerClient({ cookies })

        
        // Get user ID from URL search params
        const { searchParams } = new URL(request.url)
        const rawHashId = searchParams.get('id')
        
        if (!rawHashId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        
        // Decode URL encoding if present
        const hashId = decodeURIComponent(rawHashId);

        // Decode the hash to get the real database ID and optionally client ID
        let realId: number | null = null;
        let clientId: number | null = null;
        
        // Try decoding as underscore format first (candidateId_clientId)
        const withClient = decodeWithClient(hashId);
        
        if (withClient) {
          realId = withClient.candidateId;
          clientId = withClient.clientId;
        } else {
          // Try decoding as a simple hash (e.g., "1861" → 123)
          realId = decodeSimple(hashId);
          
          // If decoding failed, try parsing as direct integer (fallback)
          if (!realId && !isNaN(parseInt(hashId))) {
            realId = parseInt(hashId);
          }
        }
                
        if (!realId) {
          return NextResponse.json({ error: 'Invalid user ID format', debug: { hashId, withClient, simpleDecoded: decodeSimple(hashId) } }, { status: 400 })
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
            school: subscriber?.school,
            status: subscriber?.status,
            transcript_url: subscriber?.transcript_url,
            applied: subscriber?.applied,
            parsed_resume_json: subscriber?.parsed_resume_json,
            interests: subscriber?.interests,
            generated_interest_profile: subscriber?.generated_interest_profile,
            bookmarked_companies: subscriber?.bookmarked_companies,
            parsed_transcript_json: subscriber?.parsed_transcript_json,
            connections_new: subscriber?.connections_new,
            company_recommendations: subscriber?.company_recommendations,
            github_url_data: subscriber?.github_url_data, 
            github_vector_embeddings: subscriber?.github_vector_embeddings,
            // Client information from URL - not from database
            client_id: clientId,
            is_client_specific: clientId !== null
        })

    } catch (error) {
    console.error('Error checking profile:', error)
    return NextResponse.json(
        { error: 'Error checking profile' },
        { status: 500 }
    )
    }
}
