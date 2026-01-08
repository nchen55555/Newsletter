import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {

  try {
    // Parse request body to extract user data
    const body = await req.json();
    const { email, first_name, last_name } = body;

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
      message: `Congratulations on creating your profile on The Niche!   
      <br></br>
      Let's start building your professional presence on the platform. Discover opportunities that your most trusted circles are already looking at or have vetted directly on the Niche through our network-driven warm introductions. The best hires happen through trusted introductions, not job boards. That's why we've partnered with companies that value network-driven hiring. 
      <br></br>
      If your network signals a strong fit to one of our partner startups, we facilitate a warm introduction to the founders for you on your behalf. Browse their stories and profiles in your opportunity database, curate your personalized professional network contextualized by your words on your actual relationship to index and unlock opportunities personalized and tailored to your interests.`
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
         <p><a href="https://theniche.tech/people/opportunities" style="color: #0066cc; text-decoration: none;">Your Opportunity Database on The Niche</a></p>
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
