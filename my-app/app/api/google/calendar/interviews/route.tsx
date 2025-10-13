// app/api/google/calendar/interviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getCalendarClient } from '@/lib/google'
import { CalendarEvent, CalendarEventMatch, CalendarAttendee } from '@/app/types'

// -------- helpers
function parseMulti(searchParams: URLSearchParams, key: string): string[] {
  const values = searchParams.getAll(key)
  if (values.length === 0) return []
  // support comma-separated or repeated params
  return values.flatMap(v => v.split(',')).map(v => v.trim()).filter(Boolean)
}

function emailHasAnyDomain(email: string | undefined, domains: string[]) {
  if (!email) return false
  const lower = email.toLowerCase()
  return domains.some(d => lower.endsWith(`@${d.toLowerCase()}`))
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const domains = parseMulti(searchParams, 'domains') // required
  if (domains.length === 0) {
    return NextResponse.json({ error: 'Missing ?domains=example.com[,other.com]' }, { status: 400 })
  }

  const days = Number(searchParams.get('days') || 30)

  const { data, error } = await supabase
    .from('user_google_credentials')
    .select('google_refresh_token')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Not connected to Google Calendar' }, { status: 400 })
  }

  console.log('Found refresh token, creating calendar client...');
  let calendar;
  try {
    calendar = await getCalendarClient(data.google_refresh_token)
    console.log('Calendar client created successfully');
  } catch (err) {
    console.error('Failed to create calendar client:', err);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 })
  }

  const now = new Date()
  const timeMin = now.toISOString()
  const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

  // If you want *all* calendars, first list calendarList and loop; here we use primary for brevity.
  const matches: CalendarEventMatch[] = []
  let pageToken: string | undefined

  // We won't use Google's 'q' prefilter since keywords are optional now.
  do {
    const resp = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    })

    const items = (resp.data.items || []) as CalendarEvent[]
    for (const ev of items) {
      const orgEmail = ev.organizer?.email as string | undefined
      const attendeeEmails: string[] =
        (ev.attendees || []).map((a: CalendarAttendee) => a.email).filter((email): email is string => Boolean(email))

      // Domain filter (organizer OR any attendee)
      const domainHit =
        emailHasAnyDomain(orgEmail, domains) ||
        attendeeEmails.some(e => emailHasAnyDomain(e, domains))

      if (!domainHit) continue

      matches.push({
        id: ev.id,
        htmlLink: ev.htmlLink,
        summary: ev.summary,
        start: ev.start,
        end: ev.end,
        attendees: ev.attendees,
        organizer: ev.organizer,
        location: ev.location,
        hangoutLink: ev.hangoutLink,
      })
    }

    pageToken = resp.data.nextPageToken || undefined
  } while (pageToken)

  return NextResponse.json(matches)
}
