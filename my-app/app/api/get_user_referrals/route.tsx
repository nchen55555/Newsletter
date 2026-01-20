import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get user_id from query parameters
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
  }

  // Get referrals for the specific user
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer', userId);

  if (error) {
    return NextResponse.json({
      error: 'Failed to fetch user referrals',
      details: error.message,
    }, { status: 500 });
  }

  if (!referrals || referrals.length === 0) {
    return NextResponse.json([]);
  }

  // Get the email addresses of all referrals
  const referralEmails = referrals.map(referral => referral.referral_email);

  // Look up subscribers that match the referral emails
  const { data: subscribers, error: subscribersError } = await supabase
    .from('subscribers')
    .select(`
      id,
      email,
      first_name,
      last_name,
      profile_image_url,
      bio,
      school,
      interests
    `)
    .in('email', referralEmails);

  if (subscribersError) {
    console.error('Error fetching subscriber profiles:', subscribersError);
    // Still return referrals even if we can't get subscriber profiles
  }

  // Combine referrals with their subscriber profiles
  const referralsWithProfiles = referrals.map(referral => {
    const subscriberProfile = subscribers?.find(sub => sub.email === referral.referral_email);
    
    return {
      ...referral,
      subscriber_profile: subscriberProfile || null
    };
  });

  return NextResponse.json(referralsWithProfiles);
}