import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, linkedin_url } = await req.json()

    if (!email || !linkedin_url ) {
      return NextResponse.json({ error: 'Invalid email or LinkedIn URL' }, { status: 400 })
    }

    const { error } = await supabase
      .from('subscribers')
      .insert([{ email, linkedin_url }])

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
