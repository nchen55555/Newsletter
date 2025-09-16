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
    const { connect_id } = body;
    
    if (!connect_id) {
      return NextResponse.json({ error: 'connect_id is required' }, { status: 400 });
    }

    // 4. Get the current user's profile to retrieve existing connections
    const { data: currentProfile, error: fetchError } = await supabase
      .from('subscribers')
      .select('connections')
      .eq('email', user.email)
      .single();

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current profile', 
        details: fetchError.message 
      }, { status: 500 });
    }

    // 5. Get existing connections array or initialize empty array
    let connections: number[] = [];
    if (currentProfile?.connections && Array.isArray(currentProfile.connections)) {
      connections = currentProfile.connections;
    }

    // 6. Add new connection if not already present
    const connectIdNum = parseInt(connect_id);
    if (!connections.includes(connectIdNum)) {
      connections.push(connectIdNum);
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'Connection already exists',
        connections: connections
      });
    }

    // 7. Update the subscriber profile with the new connections array
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ connections: connections })
      .eq('email', user.email);

    if (updateError) {
      console.error('Connection update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update connections', 
        details: updateError.message 
      }, { status: 500 });
    }

    const { data: sendProfile, error: sendFetchError } = await supabase
      .from('subscribers')
      .select('first_name, email')
      .eq('id', connectIdNum)
      .single();

    if (sendFetchError) {
      console.error('Error fetching current profile:', sendFetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current profile', 
        details: sendFetchError.message 
      }, { status: 500 });
    }

    // Create email content using decoupled data
    const emailContent = {
      message: `${user.email} just sent you a request to be added to their verified network on The Niche! Add them back by going to your network and verifying the connection. `
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
      from: 'Abby <abby@theniche.tech>',
      to: [sendProfile.email],
      subject: '[THE NICHE] Someone Wants to Connect With You!',
      html: `
        <p>Hi ${sendProfile.first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p><a href="https://theniche.tech/people" style="color: #0066cc; text-decoration: none;">Visit your network on The Niche</a></p>
        <p>Best,<br>The Niche Team</p>
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


    return NextResponse.json({ 
      success: true,
      message: 'Connection added successfully',
      connections: connections,
      newConnectionId: connectIdNum
    });

  } catch (error) {
    console.error('Unexpected error in post_connect:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}