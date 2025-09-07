
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
    console.log(`Updating application for user: ${userEmail}, company: ${company_name}`)

    // Get subscriber ID from email
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (subError || !subscriber) {
      throw new Error(`Subscriber not found for email: ${userEmail}`)
    }

    console.log(`Found subscriber ID: ${subscriber.id}`)

    // Find or create company
    const company = await findOrCreateCompany(supabase, company_name)
    console.log(`Company resolved: ${company.id} - ${company.company_name}`)
    
    // Find existing application
    const { data: existingApp, error: findError } = await supabase
      .from('applications')
      .select('id, stage')
      .eq('candidate_id', subscriber.id)
      .eq('company_id', company.id)
      .single()
    
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

    console.log(`Setting action required: ${actionRequired} - ${actionDetails}`)
    
    if (findError && findError.code === 'PGRST116') {

      
      // No existing application, create new one
      console.log('Creating new application...')
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
      console.log(`Created new application with ID: ${applicationId}`)
    } else if (findError) {
      console.error('Error finding application:', findError)
      throw findError
    } else {
      // Update existing application
      applicationId = existingApp.id
      console.log(`Updating existing application: ${applicationId}`)
      console.log(`Updating stage from '${existingApp.stage}' to '${interview_stage}' with email confidence ${parsedData.confidence_score}`)
      
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
        console.error('Error updating application:', updateError)
        throw updateError
      }
    }

    console.log(`Successfully updated application ${applicationId}`)
    return applicationId

  } catch (error) {
    console.error('Error updating application from email:', error)
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
    console.log(`Storing email event for user: ${userEmail}`)

    // Get subscriber ID
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (subError) {
      console.error('Subscriber not found for email event:', subError)
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
  companyName: string
): Promise<Company> {
  if (!companyName) throw new Error('Company name is required')
  
  console.log(`Finding or creating company: ${companyName}`)
  
  // Try to find existing company (case-insensitive)
  const { data: existingCompany, error: findError } = await supabase
    .from('companies')
    .select('id, company_name')
    .ilike('company_name', companyName)
    .single()
  
  if (!findError && existingCompany) {
    console.log(`Found existing company: ${existingCompany.id} - ${existingCompany.company_name}`)
    return existingCompany as Company
  }
  
  // Create new company if not found
  console.log(`Creating new company: ${companyName}`)
  const { data: newCompany, error: createError } = await supabase
    .from('companies')
    .insert({
      company_name: companyName
    })
    .select('id, company_name')
    .single()
  
  if (createError) {
    // If it's a duplicate key error, try to find the existing company again
    if (createError.code === '23505') {
      console.log(`Company ${companyName} already exists, fetching existing record...`)
      const { data: existingCompany, error: findError } = await supabase
        .from('companies')
        .select('id, company_name')
        .ilike('company_name', companyName)
        .single()
      
      if (!findError && existingCompany) {
        console.log(`Found existing company after duplicate error: ${existingCompany.id} - ${existingCompany.company_name}`)
        return existingCompany as Company
      }
    }
    
    console.error('Error creating company:', createError)
    throw createError
  }
  
  console.log(`Created new company: ${newCompany.id} - ${newCompany.company_name}`)
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

  console.log('Validation passed for parsed email data')
  return true
}