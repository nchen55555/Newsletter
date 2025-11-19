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
    const { status, timeline, outreach_frequency } = body

    // Validate status
    const validStatuses = [
      'perusing', 
      'open_to_outreach', 
      'request_intros', 
      'recommend_opportunities', 
      'actively_searching'
    ]
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate timeline if provided
    const validTimelines = ['immediate', 'short_term', 'medium_term', 'long_term', 'flexible']
    if (timeline && !validTimelines.includes(timeline)) {
      return NextResponse.json({ error: 'Invalid timeline' }, { status: 400 })
    }

    // Prepare update data
    const updateData: {
      check_in_status: string
      interview_status_updated_at: string
      timeline_of_search?: string
      outreach_frequency?: number
    } = {
      check_in_status: status,
      interview_status_updated_at: new Date().toISOString()
    }

    // Add timeline if provided
    if (timeline) {
      updateData.timeline_of_search = timeline
    }

    // Add outreach frequency if provided
    if (outreach_frequency !== undefined) {
      updateData.outreach_frequency = outreach_frequency
    }

    // Update user status in the profiles table
    const { error: updateError } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('email', user.email)

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status updated successfully',
      status: status,
      timeline: timeline,
      outreach_frequency: outreach_frequency
    })
    
  } catch (error) {
    console.error('Error in update_user_status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}