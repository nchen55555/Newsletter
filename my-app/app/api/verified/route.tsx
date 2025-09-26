import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    const { 
      email, 
      subject, 
      first_name = '',
      from = 'Nicole <nicole@theniche.tech>' 
    } = body;

    console.log('Email request received for:', { email, subject });

    if (!email) {
      console.error('Missing required field: email');
      return NextResponse.json({ 
        error: 'Missing required field: email' 
      }, { status: 400 });
    }

    if (!subject) {
      console.error('Missing required field: subject');
      return NextResponse.json({ 
        error: 'Missing required field: subject' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'Email service not configured - missing API key' 
      }, { status: 500 });
    }

    const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

    console.log('Attempting to send email to:', email);

    const greeting = first_name ? `Hi ${first_name},` : 'Hello,';

    const message = `Thank you for filling out your profile and information with <a href="https://theniche.tech">The Niche</a>! Based on your profile and interests, we would recommend connecting you with Unify, Reve, Footprint, Pylon, and Blockit to match your interests in Product and Engineering. 
    
    We are not directly partnered with Footprint, Reve, or Pylon, but if you are interested we can make a connect for you to the teams there! For our partners, you can directly indicate interest in connecting with the founders on our opportunities page. As always, please let us know if you have any questions - you can reach us at thenichestlist@gmail.com.`
    
    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html: `
        <p>${greeting}</p>
        <p>${message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <p>Best,<br>The Niche Team</p>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('Email sent successfully:', { email, emailId: data?.id });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      email: email,
      emailId: data?.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// curl -X POST http://localhost:3000/api/verified \
//     -H "Content-Type: application/json" \
//     -d '{
//       "email": "joyce_lu@college.harvard.edu",
//       "subject": "[THE NICHE] Your Profile Update",
//       "first_name": "Joyce"
//     }'

