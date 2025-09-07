import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Session + user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const email = session?.user?.email
    if (!email) return NextResponse.json({ isSubscribed: false })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      await supabase.auth.signOut()
      return NextResponse.json({ isSubscribed: false })
    }

    // === Get ALL applications with email tracking data ===
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        stage,
        action_required,
        action_required_description,
        date_added,
        last_email_update,
        email_confidence,
        subscriber:subscribers!inner ( id, email ),
        company:companies!inner ( id, company_name )
      `)
      .eq('subscriber.email', email)

    if (appError) throw appError

    // Get email events count for each application
    const applicationIds = applications?.map(app => app.id) || []
    
    let emailEventsCounts: { [key: string]: number } = {}
    if (applicationIds.length > 0) {
      const { data: eventCounts, error: countError } = await supabase
        .from('email_events')
        .select('application_id')
        .in('application_id', applicationIds)
      
      if (!countError && eventCounts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emailEventsCounts = eventCounts.reduce((acc: { [key: string]: number }, event: any) => {
          acc[event.application_id] = (acc[event.application_id] || 0) + 1
          return acc
        }, {})
      }
    }

    // Get user's webhook email from subscribers table
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('webhook_email')
      .eq('email', email)
      .single()

    const applicationsWithEmailData = applications?.map(app => ({
      ...app,
      email_events_count: emailEventsCounts[app.id] || 0
    }))

    return NextResponse.json({
      applications: applicationsWithEmailData ?? [],
      tracking_email: subscriber?.webhook_email
    })
  } catch (error) {
    console.error('Error checking profile:', error)
    return NextResponse.json({ error: 'Error checking profile' }, { status: 500 })
  }
}