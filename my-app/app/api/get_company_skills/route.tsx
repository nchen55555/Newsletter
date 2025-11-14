import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get client ID from URL search params
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
        
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Fetch company match profiles by client ID (company ID)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, candidate_profiles_good')
      .eq('id', parseInt(clientId))
      .single()

    if (companyError) {
      return NextResponse.json({ 
        error: 'Failed to fetch company data' 
      }, { status: 500 })
    }

    if (!company) {
      return NextResponse.json({ 
        error: 'Company not found' 
      }, { status: 404 })
    }

    // Get match profiles (already parsed by Supabase)
    const matchProfiles = company.candidate_profiles_good || [];
    console.log('📊 API: Match profiles:', matchProfiles)

    const response = {
      success: true,
      company: {
        id: company.id,
        name: company.company_name,
        match_profiles: matchProfiles
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error occurred' 
    }, { status: 500 })
  }
}