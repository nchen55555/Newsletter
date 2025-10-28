import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, linkedin_url, referral_id } = await req.json()

    if (!email || !linkedin_url ) {
      return NextResponse.json({ error: 'Invalid email or LinkedIn URL' }, { status: 400 })
    }

    const {data: existingSubscribers, error: existingSubscriberError} = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', email)
      
    if (existingSubscriberError) {
      console.error('Supabase query error:', existingSubscriberError)
      return NextResponse.json({ error: existingSubscriberError.message }, { status: 500 })
    }

    const existingSubscriber = existingSubscribers && existingSubscribers.length > 0



    if (existingSubscriber) {
      return NextResponse.json({ existingSubscriber: true }, { status: 400 })
    }

    const { error } = await supabase
      .from('subscribers')
      .insert([{ email, linkedin_url, referral_id }])

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
