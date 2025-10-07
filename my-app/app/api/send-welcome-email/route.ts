import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {

  try {
    // Parse request body to extract user data
    const body = await req.json();
    const { email, first_name, last_name } = body;

    console.log('Welcome email request received for:', { email, first_name, last_name });

    // Validate required fields from request body
    if (!email || !first_name || !last_name) {
      console.error('Missing required fields:', { email: !!email, first_name: !!first_name, last_name: !!last_name });
      return NextResponse.json({ 
        error: 'Missing required fields: email, first_name, last_name' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Create email content using decoupled data
    const emailContent = {
      message: `Congratulations on requesting access to The Niche! We are excited to review your profile for our private beta launch. If we believe there is mutual fit between our network of beta opportunities or if a founder reaches out to specifically connect with you, we will reach back out with an invitation to be officially a part of this network! 
      <br></br>
      In the meantime, feel free to curate your professional network by connecting to your verified professional community or bringing others on to the platform, sharing your thoughts on our company articles with your network, and more! Interacting more with The Niche allows us to better understand your interests and how our network of beta opportunities might be a good fit for you.`
    };
    // Check if API key exists
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'Email service not configured - missing API key' 
      }, { status: 500 });
    }

    const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

    console.log('Attempting to send welcome email to:', email);

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

    console.log('Welcome email sent successfully:', { email, emailId: data?.id });

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
