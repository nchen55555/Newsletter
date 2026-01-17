import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {

  try {

    // 3. Parse JSON body
    const body = await req.json();
    const {
      userId,
      userName,
      userEmail,
      feedbackType,
      subject,
      message
    } = body;

    if (!userId || !subject || !message){
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 5. Send email notification to team
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
      console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
      return NextResponse.json({
        error: 'Email service not configured - missing API key'
      }, { status: 500 });
    }

    const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

    const feedbackTypeLabel = feedbackType === 'bug' ? 'Bug Report' :
                              feedbackType === 'feature' ? 'Feature Request' :
                              'General Feedback';

    const { data, error } = await resend.emails.send({
      from: 'The Niche Feedback <nicole@theniche.tech>',
      to: ['nicole@theniche.tech'],
      subject: `[${feedbackTypeLabel}] ${subject}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Type:</strong> ${feedbackTypeLabel}</p>
        <p><strong>From:</strong> ${userName} (${userEmail})</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      // Don't fail the request if email fails, feedback is already saved
      console.log('Feedback saved but email notification failed');
    } else {
      console.log('Feedback email sent successfully:', data);
    }

    return NextResponse.json({ success: true });

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
