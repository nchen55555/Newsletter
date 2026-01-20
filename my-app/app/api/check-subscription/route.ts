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
    
    // Fetch subscriber data to check for required fields
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('first_name, last_name, linkedin_url, phone_number')
      .eq('email', session.user.email)
      .single()

    if (subError) {
      // If no subscriber found, they're not subscribed
      if (subError.code === 'PGRST116') {
        return NextResponse.json({ isSubscribed: false })
      }
      throw subError
    }

    // Check that all required fields are not null AND not empty
    const hasAllRequiredFields = subscriber &&
      subscriber.first_name && subscriber.first_name.trim() !== '' &&
      subscriber.last_name && subscriber.last_name.trim() !== '' &&
      subscriber.linkedin_url && subscriber.linkedin_url.trim() !== '' &&
      subscriber.phone_number && subscriber.phone_number.trim() !== ''

    console.log("is subscribed? ", hasAllRequiredFields, "subscriber:", subscriber)

    return NextResponse.json({
      isSubscribed: hasAllRequiredFields,
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
