import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {

  try {
    // Parse request body to extract user data
    const body = await req.json();
    const { email, first_name, last_name } = body;

    // Validate required fields from request body
    if (!email || !first_name || !last_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, first_name, last_name' 
      }, { status: 400 });
    }

    // Create email content using decoupled data
    const emailContent = {
      message: `Thank you for your interest in The Niche and welcome to this public beta! It takes about 2-3 days for us to ingest all your information and come back with opportunities indexed to your skillsets and interests. In the meantime though, you can start exploring our platform, connecting with our partner startups (if there is a mutual fit, your first meeting will generally be with the founder), and meeting others on the platform!`
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
      from: 'Nicole <nicole@theniche.tech>',
      to: [email],
      subject: '[THE NICHE] Welcome',
      html: `
        <p>Hi ${first_name},</p>
        <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
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
      message: 'Welcome email sent successfully',
      email: email,
      emailId: data?.id
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ 
      error: 'Failed to send welcome email', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
