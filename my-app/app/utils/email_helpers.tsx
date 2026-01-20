
// File: /app/utils/email_helpers.ts
// Updated email processing helpers for Supabase with new parse flow

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Company } from '@/app/types'

// Type definitions
export interface ParsedEmailData {
  event_type: 'scheduled' | 'completed' | 'feedback' | 'progression' | 'offer' | 'rejection' | 'unknown'
  company_name: string
  interview_stage: 'Applied' | 'Phone Screen' | 'Technical Interview' | 'Onsite Interview' | 'Final Round' | 'Offer Received' | 'Offer Accepted' | 'Offer Declined' | 'Rejected' | 'Withdrawn' | 'unknown'
  interview_date: string | null // ISO date string or null
  key_details: string
  confidence_score: number // 0-1
  action_required: boolean
  next_steps: string | null
  parsed_at?: string // ISO date string, added by our system
}

export async function updateApplicationFromEmail(
  parsedData: ParsedEmailData, 
  userEmail: string
): Promise<string> {
  const supabase = createRouteHandlerClient({ cookies })
  const { company_name, interview_stage, event_type, key_details, next_steps } = parsedData
  
  try {

    // Get subscriber ID from email
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (subError || !subscriber) {
      throw new Error(`Subscriber not found for email: ${userEmail}`)
    }


    // Find or create company
    const company = await findOrCreateCompany(supabase, company_name)
    
    // Find existing application
    const { data: existingApp, error: findError } = await supabase
      .from('applications')
      .select('id, stage')
      .eq('candidate_id', subscriber.id)
      .eq('company_id', company.id)
      .single()
    
    if (findError){
      console.error("Finding existing application ", findError)
    }
    
    let applicationId: string

    // Update action required based on event type
    let actionRequired: 'Yes' | 'No' | 'TBD' = 'No'
    let actionDetails = ''
    
    if (event_type === 'scheduled') {
      actionRequired = 'Yes'
      actionDetails = 'Prepare for upcoming interview'
    } else if (event_type === 'offer') {
      actionRequired = 'Yes'
      actionDetails = 'Review and respond to job offer'
    } else if (parsedData.action_required) {
      actionRequired = 'TBD'
      actionDetails = next_steps || key_details
    }

    
    if (findError && findError.code === 'PGRST116') {

      
      // No existing application, create new one
      const { data: newApp, error: createError } = await supabase
        .from('applications')
        .insert({
          candidate_id: subscriber.id,
          company_id: company.id,
          stage: interview_stage,
          date_added: new Date().toISOString(),
          action_required: actionRequired, 
          action_required_description: actionDetails,
          email_confidence: parsedData.confidence_score
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Error creating application:', createError)
        throw createError
      }
      applicationId = newApp.id
    } else if (findError) {
      console.error('Error finding application:', findError)
      throw findError
    } else {
      // Update existing application
      applicationId = existingApp.id
      
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          stage: interview_stage,
          action_required: actionRequired,
          action_required_description: actionDetails,
          email_confidence: parsedData.confidence_score
        })
        .eq('id', applicationId)
      
      if (updateError) {
        console.log("Updating applications error ", updateError)
      }
    }

    return applicationId

  } catch (error) {
    throw error
  }
}

export async function storeEmailEvent(
  parsedData: ParsedEmailData, 
  userEmail: string, 
  rawEmail: string
): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {

    // Get subscriber ID
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (subError) {
      return // Don't throw, just log
    }

    const company = await findOrCreateCompany(supabase, parsedData.company_name)
    
    // Find application ID
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', subscriber.id)
      .eq('company_id', company.id)
      .single()

    if (appError) {
      console.error('Error getting application', appError)
    } 
    
    const applicationId = application?.id || null
    
    // Store email event
    const { error: eventError } = await supabase
      .from('email_events')
      .insert({
        application_id: applicationId,
        subscriber_id: subscriber.id,
        event_type: parsedData.event_type,
        stage: parsedData.interview_stage,
        interview_date: parsedData.interview_date,
        details: parsedData.key_details,
        next_steps: parsedData.next_steps,
        confidence: parsedData.confidence_score,
        action_required: parsedData.action_required,
        parsed_data: parsedData,
        raw_email: rawEmail,
        parsed_at: new Date().toISOString()
      })
    
    if (eventError) {
      console.error('Error storing email event:', eventError)
    } else {
      console.log('Email event stored successfully')
    }
    
  } catch (error) {
    console.error('Error in storeEmailEvent:', error)
    // Don't throw - we don't want email processing to fail just because storage fails
  }
}
export async function findOrCreateCompany(
  supabase: SupabaseClient, 
  domainName: string  // Now expecting domain name (e.g., "google.com")
): Promise<Company> {
  if (!domainName) throw new Error('Domain name is required')
    
  // First try to find company by domain
  const { data: existingCompany, error: domainFindError } = await supabase
    .from('companies')
    .select('id, company_name, domain')
    .eq('domain', domainName)
    .single()
  
  if (!domainFindError && existingCompany) {
    return existingCompany as Company
  }
  
  // Fallback: try to find by company name (case-insensitive) in case domain is in company_name field
  const { data: existingCompanyByName, error: findError } = await supabase
    .from('companies')
    .select('id, company_name, domain')
    .ilike('company_name', domainName)
    .single()
  
  if (!findError && existingCompanyByName) {
    console.log('Found existing company by name:', existingCompanyByName)
    return existingCompanyByName as Company
  }
  
  // Create new company if not found - use domain for both company_name and domain
  const newCompanyData = {
    company_name: domainName,  // Store domain as company name
    domain: domainName         // Also store in domain field
  }
    
  const { data: newCompany, error: createError } = await supabase
    .from('companies')
    .insert(newCompanyData)
    .select('id, company_name, domain')
    .single()
  
  if (createError) {
    // If it's a duplicate key error, try to find the existing company again
    if (createError.code === '23505') {
      console.log('Duplicate error, trying to find existing company...')
      
      // Try domain first
      const { data: existingCompany, error: domainFindError } = await supabase
        .from('companies')
        .select('id, company_name, domain')
        .eq('domain', domainName)
        .single()
      
      if (!domainFindError && existingCompany) {
        return existingCompany as Company
      }
      
      // Try by name
      const { data: existingCompanyByName, error: nameFindError } = await supabase
        .from('companies')
        .select('id, company_name, domain')
        .ilike('company_name', domainName)
        .single()
      
      if (!nameFindError && existingCompanyByName) {
        return existingCompanyByName as Company
      }
    }
    
    console.error('Error creating company:', createError)
    throw createError
  }
  
  return newCompany as Company
}

// Helper function to validate parsed data
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function validateParsedEmailData(data: any): data is ParsedEmailData {
  if (!data || typeof data !== 'object') {
    console.error('Validation failed: data is not an object')
    return false
  }

  const validEventTypes = ['scheduled', 'completed', 'feedback', 'progression', 'offer', 'rejection', 'unknown']
  const validInterviewStages = ['Applied', 'Phone Screen', 'Technical Interview', 'Onsite Interview', 'Final Round', 'Offer Received', 'Offer Accepted', 'Offer Declined', 'Rejected', 'Withdrawn', 'unknown']

  const checks = [
    { field: 'event_type', type: 'string', values: validEventTypes },
    { field: 'company_name', type: 'string' },
    { field: 'interview_stage', type: 'string', values: validInterviewStages },
    { field: 'key_details', type: 'string' },
    { field: 'confidence_score', type: 'number', min: 0, max: 1 },
    { field: 'action_required', type: 'boolean' }
  ]

  for (const check of checks) {
    if (!(check.field in data)) {
      console.error(`Validation failed: missing field '${check.field}'`)
      return false
    }

    if (typeof data[check.field] !== check.type) {
      console.error(`Validation failed: '${check.field}' should be ${check.type}, got ${typeof data[check.field]}`)
      return false
    }

    if (check.values && !check.values.includes(data[check.field])) {
      console.error(`Validation failed: '${check.field}' value '${data[check.field]}' not in allowed values`)
      return false
    }

    if (check.min !== undefined && data[check.field] < check.min) {
      console.error(`Validation failed: '${check.field}' value ${data[check.field]} below minimum ${check.min}`)
      return false
    }

    if (check.max !== undefined && data[check.field] > check.max) {
      console.error(`Validation failed: '${check.field}' value ${data[check.field]} above maximum ${check.max}`)
      return false
    }
  }

  // Optional fields validation
  if (data.interview_date !== null && typeof data.interview_date !== 'string') {
    console.error('Validation failed: interview_date should be string or null')
    return false
  }

  if (data.next_steps !== null && typeof data.next_steps !== 'string') {
    console.error('Validation failed: next_steps should be string or null')
    return false
  }

  return true
}