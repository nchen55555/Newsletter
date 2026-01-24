import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
    const cookieStore = cookies();
    try{
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { early_interest, company_title, first_name, email, candidate_id, company_id, additional_info, role} = await req.json();
        

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        

        const { error: dbError } = await supabase
        .from('applications')
        .insert({
            candidate_id: candidate_id,
            company_id: company_id,
            additional_info: additional_info, 
            role: role, 
            early_interest: early_interest
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
        message: `Thank you for taking your time to request an intro with ${company_title}! Your request has been sent direct to their inbox. Please look forward to a response back within the next week or so. `
      };
      // Check if API key exists
      if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
        console.error('NEXT_PUBLIC_RESEND_API_KEY is not set in environment variables');
        return NextResponse.json({ 
          error: 'Email service not configured - missing API key' 
        }, { status: 500 });
      }
  
      const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
  
      const { error } = await resend.emails.send({
        from: 'Warm Intros at The Niche <warm_intros@theniche.tech>',
        to: [email],
        subject: '[THE NICHE] Warm Intro Request Received',
        html: `
          <p>Hi ${first_name}!</p>
          <p>${emailContent.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          <p><a href="https://theniche.tech/ats" style="color: #0066cc; text-decoration: none;">Track your warm intros and processes directly on The Niche</a></p>
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
  
        return NextResponse.json({ success: true});

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Unexpected error occurred', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
        }
    
}