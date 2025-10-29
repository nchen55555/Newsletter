import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  // Await cookies() before using
  const cookieStore = cookies();

  try {
    // 1. Create Supabase client using route handler with awaited cookies
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 2. Authenticate the user (use await)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 3. Parse JSON body
    const body = await req.json();
    const { 
      name,
      referralName, 
      referralEmail, 
      referralBackground,
      id,
      email_send
    } = body;
    
    // Capitalize first letters of names
    const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const capitalizedName = name ? name.split(' ').map((word: string) => capitalizeFirstLetter(word)).join(' ') : '';
    const capitalizedReferralName = referralName ? referralName.split(' ').map((word: string) => capitalizeFirstLetter(word)).join(' ') : '';
    
    if (!referralEmail || !id){
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // All fields are now optional - no validation required
    // 6. Update subscriber profile with step 3 data
    const { error: dbError } = await supabase
      .from('referrals')
      .insert({ referral_name: referralName, referral_email: referralEmail, referral_background: referralBackground, referrer: id })

    if (dbError) {
      console.error('Referral update error', dbError);
      return NextResponse.json({ 
        error: 'Failed to update step 3 profile data', 
        details: dbError.message 
      }, { status: 500 });
    }

    if (!email_send) {
      return NextResponse.json({ success: true});
    }

    const emailContent = {
        message: `Hope you are well! My name is Nicole. A mutual friend of ours, ${capitalizedName}, has requested that you join their <a href="https://theniche.tech/access" style="color: #0066cc; text-decoration: none;">verified, professional network</a> on The Niche, so I wanted to personally reach out to you to extend an invite. 
                
        The Niche is an exclusive network that partners with some of the highest-growth startups and connects them to exceptional early talent, indexing on their interests, matched to their skills, and most importantly, "verified" by their networks. Interfacing directly with the founders of our partners, our company profiles include Listen Labs, Exa, Basis, Phia (founded by Phoebe Gates), and most recently, Anysphere (Cursor) which, for the first time, is building  their early talent pipelines on our platform.

        The network is accessible only by referral so congratulations on receiving this email! In particular, your background piqued my interest, and I would love to extend an <a href="https://theniche.tech/access" style="color: #0066cc; text-decoration: none;">initial invite</a> for you to access and build your professional network on the platform.

        You will need to curate your profile (resumes, transcripts, github urls, personal networks, interests, etc), which we use to recommend professional opportunities to you. You build out your professional network on the platform too, connecting with people in your know that you have worked on group projects with or professionally. We use your verified professional network to index and better recommend you opportunities, and as a way for you to also be in the know of what opportunities your smartest friends are currently interested in. You can request to connect and intro with our partner startups, and your profile will be sent directly to the founders. Pending mutual interest, your next communication with that company will be direct with the founders!

        If you have any questions or if you're interested in chatting more as well, feel free to let us know as well. We are excited to welcome you to the private beta of The Niche network! 
        `
      };
      // Check if API key exists
      if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
        console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
        return NextResponse.json({ 
          error: 'Email service not configured - missing API key' 
        }, { status: 500 });
      }
  
      const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
  
      const { data, error } = await resend.emails.send({
        from: 'Nicole Chen <nicole@theniche.tech>',
        to: [referralEmail],
        cc: ["" + user.email],
        subject: `${capitalizedName} Wants to Refer You to Their Professional Network on The Niche`,
        html: `
          <p>Hi ${capitalizedReferralName}!</p>
          <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          <p>Best,<br><br>The Niche Team</p>
        `,
      });
  
      if (error) {
        console.error('Resend email error:', error);
        return NextResponse.json({ 
          error: 'Failed to send welcome email', 
          details: error.message 
        }, { status: 500 });
      }
  
      console.log('Email sent successfully:', data);

    return NextResponse.json({ success: true});

    } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
        error: 'Unexpected error occurred', 
        details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
    }
    
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}