import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      id,
      company_name,
      stage,
      action_required,
      action_required_description,
      date_added,
    } = await request.json()

    // Get subscriber ID
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single()
    
    if (subError) throw subError

    // Handle temp IDs (new applications)
    const isNewApplication = typeof id === 'string' && id.startsWith('tmp_')
    
    if (isNewApplication) {
      // Find or create company
      const { error: companyFindError, data } = await supabase
        .from('companies')
        .select('id')
        .ilike('company_name', company_name)
        .single()
      
      let company = data
      
      if (companyFindError && companyFindError.code === 'PGRST116') {
        // Company doesn't exist, create it
        const { data: newCompany, error: companyCreateError } = await supabase
          .from('companies')
          .insert({ company_name })
          .select('id')
          .single()
        
        if (companyCreateError) throw companyCreateError
        company = newCompany
      } else if (companyFindError) {
        throw companyFindError
      }

      // Create new application
      const { data: newApp, error: createError } = await supabase
        .from('applications')
        .insert({
          candidate_id: subscriber.id,
          company_id: company?.id,
          stage,
          action_required,
          action_required_description,
          date_added: date_added || new Date().toISOString(),
        })
        .select('id')
        .single()
      
      if (createError) throw createError
            
      return NextResponse.json({ 
        success: true,
        application: { id: newApp.id }
      })
      
    } else {
      // Update existing application
      const updateData = {
        stage,
        action_required,
        action_required_description
      }
      
      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id)
      
      if (updateError) throw updateError
      
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json({ error: 'Error updating application' }, { status: 500 })
  }
}