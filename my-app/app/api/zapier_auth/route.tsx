// File: /app/api/zapier_auth/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { user_email } = await request.json()

    if (!user_email) {
      return NextResponse.json(
        { error: 'User email is required' }, 
        { status: 400 }
      )
    }

    // Verify user exists in your system
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: subscriber, error } = await supabase
      .from('subscribers')
      .select('id, email')
      .eq('email', user_email)
      .single()

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'User not found in The Niche ATS' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        email: subscriber.email,
        id: subscriber.id
      }
    })
    
  } catch (error) {
    console.error('Zapier auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}