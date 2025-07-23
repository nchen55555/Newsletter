import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  console.log('API route hit - checking subscription')
  try {
    console.log('Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Auth response:', { user, error: userError })
    
    if (!user?.email) {
      console.log('No user email found')
      return NextResponse.json({ isSubscribed: false })
    }

    console.log('Checking subscription for email:', user.email)

    // Get all matching subscribers
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', user.email)

    console.log('Subscriber query result:', { subscribers, error })

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const isSubscribed = subscribers && subscribers.length > 0
    console.log('Final subscription status:', isSubscribed)
    
    // They're subscribed if we find any rows with their email
    return NextResponse.json({ isSubscribed })
  } catch (error) {
    console.error('Unexpected API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
