import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    // Update demo_done status in profiles table using email
    const { error } = await supabase
      .from('subscribers')
      .update({ demo_done: true })
      .eq('email', session.user.email)
    
    if (error) {
      console.error('Error updating demo status:', error)
      return NextResponse.json(
        { error: 'Failed to update demo status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Demo marked as complete'
    })

  } catch (error) {
    console.error('Error marking demo complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}