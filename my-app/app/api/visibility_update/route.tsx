import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, visibility_profile_settings } = body

    // Validate status
    // Update user status in the profiles table
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({visibility_profile_settings: visibility_profile_settings})
      .eq('id', id)

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Visibility settings updated successfully',
    })
    
  } catch (error) {
    console.error('Error in visibility_update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}