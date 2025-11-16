import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user?.email) {
      return NextResponse.json({ isSubscribed: false })
    }
    
    // Check if email exists in subscribers table
    const { count, error: subError } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('email', session.user.email)
    
    if (subError) throw subError
    
    return NextResponse.json({ 
      isSubscribed: count !== null && count > 0,
      email: session.user.email 
    })

  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      { error: 'Error checking subscription status' },
      { status: 500 }
    )
  }
}
