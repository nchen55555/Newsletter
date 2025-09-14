import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    try{
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { first_name, email, candidate_id, company_id, additional_info } = await req.json();
        

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        

        const { error: dbError } = await supabase
        .from('applications')
        .insert({
            candidate_id: candidate_id,
            company_id: company_id,
            additional_info: additional_info
        })
        .single();

        if (dbError) {
            console.error('Application creation error:', dbError);
            return NextResponse.json({ 
                error: 'Failed to create application', 
                details: dbError.message 
            }, { status: 500 });
        }

        // Create email content using decoupled data
    const emailContent = {
        message: `Congratulations! We have sent your application in. Replies back from our partner companies typically take less than a week so we will circle back to you then.`
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
        subject: '[THE NICHE] Application Received',
        html: `
          <p>Hi ${first_name}!</p>
          <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          <p><a href="https://theniche.tech/ats" style="color: #0066cc; text-decoration: none;">Visit your applications and their statuses on The Niche</a></p>
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

        return NextResponse.json({ success: true});

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Unexpected error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
        }
    
}