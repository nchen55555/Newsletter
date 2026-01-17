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
      id
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


    const emailContent = {
        message: `${capitalizedName} has referred and requested you join <a href="https://theniche.tech" style="color: #0066cc; text-decoration: none;">The Niche</a> as part of their verified, professional network. Accept their request by <a href="https://theniche.tech" style="color: #0066cc; text-decoration: none;">creating a profile</a> on The Niche. 
        <br></br>
        The best opportunities have always been through word-of-mouth or referral - we're just digitalizing it.  The Niche is an exclusive network that surfaces warm introductions to opportunities your most trusted professional network are already looking at or have vetted. Take advantage of our network-driven hiring to unlock opportunities at our partners including Unify, Moment, Crosby, Warp, and more!
        <br></br>
        The network is accessible only by referral so congratulations on receiving this email! If you have any questions, feel free to reach back out to us at nicole@theniche.tech.
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
        from: 'Referrals at The Niche <referrals@theniche.tech>',
        to: [referralEmail],
        subject: `${capitalizedName} Referred You to Their Niche Network`,
        html: `
          <p>Hi ${capitalizedReferralName},</p>
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