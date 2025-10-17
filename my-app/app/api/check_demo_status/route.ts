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
      return NextResponse.json({ demo_done: false })
    }
    
    // Check demo_done status in profiles table using email
    const { data, error } = await supabase
      .from('subscribers')
      .select('demo_done, verified')
      .eq('email', session.user.email)
      .single()
    
    if (error) {
      console.error('Error fetching demo status:', error)
      return NextResponse.json({ demo_done: false })
    }
    
    return NextResponse.json({ 
      demo_done: data?.demo_done || false,
      verified: data?.verified || false 
    })

  } catch (error) {
    console.error('Error checking demo status:', error)
    return NextResponse.json(
      { error: 'Error checking demo status' },
      { status: 500 }
    )
  }
}