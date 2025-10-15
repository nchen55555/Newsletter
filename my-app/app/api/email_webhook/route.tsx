// File: /app/api/email_webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    
    const formData = await request.formData()
    
    const emailData = {
      from: formData.get('from') as string,
      to: formData.get('to') as string,
      bcc: formData.get('bcc') as string,
      subject: formData.get('subject') as string,
      email: formData.get('email') as string, // Full email content
    }
        
    // Extract user from @theniche.fyi recipient (check email headers for any @theniche.fyi address)
    let recipientEmail = emailData.bcc
    
    // If BCC field is empty, try to extract any @theniche.fyi address from email headers
    if (!recipientEmail && emailData.email) {
      const theNicheMatch = emailData.email.match(/([^\s<]+@theniche\.fyi)/m)
      if (theNicheMatch) {
        recipientEmail = theNicheMatch[1]
      }
    }
    
    if (!recipientEmail?.includes('@theniche.fyi')) {
      return NextResponse.json({ error: 'Invalid recipient domain' }, { status: 400 })
    }
        
    // Look up user in Supabase by matching the identifier
    const { data: user, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('webhook_email', recipientEmail)
      .single()

    console.log("User data ", user)

    
    if (error || !user.email) {
      console.error('User lookup failed:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
        
    // Process with your existing parse_email logic
    const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://www.theniche.tech'
  await fetch(`${baseUrl}/api/parse_email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        emailContent: emailData.email, 
        userEmail: user.email,
        fromEmail: emailData.from,
        toEmail: emailData.to
      })
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}