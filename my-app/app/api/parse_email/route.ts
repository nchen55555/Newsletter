// File: /app/api/parse_email/route.ts
  // Updated with proper types
  
  import { GoogleGenerativeAI } from "@google/generative-ai"
  import { NextRequest, NextResponse } from "next/server"
  import { 
    updateApplicationFromEmail, 
    storeEmailEvent, 
    validateParsedEmailData
  } from "@/app/utils/email_helpers"
  import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
  import { cookies } from 'next/headers'

  // Helper function to verify if company name matches sender domain
  function verifyCompanyDomain(companyName: string, fromEmail: string | null, toEmail: string | null): boolean {
    if (!companyName || (!fromEmail && !toEmail)) return false
    
    // Normalize company name for comparison
    const normalizedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const emails = [fromEmail, toEmail].filter(Boolean) as string[]
    
    for (const email of emails) {
      if (!email) continue
      
      // Extract domain from email
      const domainMatch = email.match(/@([^>]+?)(?:\s|>|$)/)
      if (!domainMatch) continue
      
      const domain = domainMatch[1].toLowerCase()
      
      // Check if domain contains company name
      const normalizedDomain = domain.replace(/[^a-z0-9]/g, '')
      
      // Direct match or company name is contained in domain
      if (normalizedDomain.includes(normalizedCompany) || normalizedCompany.includes(normalizedDomain)) {
        console.log(`Domain verification passed: ${companyName} matches domain ${domain}`)
        return true
      }
    }
    
    console.log(`Domain verification failed: ${companyName} does not match domains from ${fromEmail}, ${toEmail}`)
    return false
  }
  
  
  const SYSTEM_INSTRUCTIONS = `
  You are an expert email parser for an application tracking system. Your job is to analyze emails between job candidates and companies to extract structured interview progress data.
  
  For each email, return a JSON object with the following structure:
  {
    "event_type": "scheduled" | "completed" | "feedback" | "progression" | "offer" | "rejection" | "unknown",
    "company_name": "string (extract from email domain or signature)",
    "interview_stage": "Applied" | "Phone Screen" | "Technical Interview" | "Onsite Interview" | "Final Round" | "Offer Received" | "Offer Accepted" | "Offer Declined" | "Rejected" | "Withdrawn" | "unknown",
    "interview_date": "YYYY-MM-DD HH:MM or null if not mentioned",
    "key_details": "string (brief summary of important info)",
    "confidence_score": "number between 0-1",
    "action_required": "boolean (does candidate need to respond/take action)",
    "next_steps": "string or null"
  }
  
  Key guidelines:
  - Be conservative with confidence scores - only high confidence (0.8+) for very clear signals
  - Extract company name from email domain, signature, or explicit mentions
  - Identify interview stages from context clues (technical challenge, culture fit, final round, etc.)
  - Recognize scheduling vs confirmation vs feedback vs outcome emails
  - Handle rejection and offer emails with high confidence
  - If email is not interview-related, return event_type: "unknown" with low confidence
  `
  
  export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
      const { emailContent, userEmail, fromEmail, toEmail } = await request.json()
  
      if (!emailContent || typeof emailContent !== 'string') {
        return NextResponse.json(
          { error: 'Email content is required and must be a string' }, 
          { status: 400 }
        )
      }

      console.log("Email parsing")

      // Use userEmail from webhook if provided, otherwise fall back to auth
      let finalUserEmail = userEmail
      
      if (!finalUserEmail) {
        // Fall back to session auth if no userEmail provided
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.user?.email) {
          return NextResponse.json({ error: 'No user email provided' }, { status: 401 })
        }
        finalUserEmail = session.user.email
      }

      console.log("User email ", finalUserEmail)
  
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMENI_API_KEY!)
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTIONS,
      })
  
      // Parse email with Gemini
      const prompt = `
  Parse this email for interview tracking data:
  
  EMAIL CONTENT:
  ${emailContent}
  
  Return only valid JSON with the specified structure.
  `
  
      const result = await model.generateContent(prompt)

      console.log("gemini parsed result ", result)
      const response = await result.response
      const text = response.text()
      
      console.log("gemini response text:", text)
      
      // Continue from where your code left off...

      // Parse the JSON response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsedData: any
      try {
        // Clean the text by removing markdown code blocks
        let cleanedText = text.trim()
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '')
        }
        
        parsedData = JSON.parse(cleanedText.trim())
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return NextResponse.json(
          { error: 'Invalid JSON response from AI parser' },
          { status: 500 }
        )
      }
      
      // Validate the parsed data structure
      if (!validateParsedEmailData(parsedData)) {
        console.error('Invalid data structure:', parsedData)
        return NextResponse.json(
          { error: 'Invalid data structure from AI parser' },
          { status: 500 }
        )
      }
      
      // Add metadata
      parsedData.parsed_at = new Date().toISOString()
      
      console.log("Validated parsed data:", parsedData)
      
      // Verify domain matches company name
      const domainVerified = verifyCompanyDomain(parsedData.company_name, fromEmail, toEmail)
      console.log("Domain verification result:", domainVerified)
      
      // Adjust confidence score based on domain verification
      if (!domainVerified) {
        console.log(`Reducing confidence from ${parsedData.confidence_score} due to domain mismatch`)
        parsedData.confidence_score = Math.min(parsedData.confidence_score, 0.3) // Cap at low confidence
      }
      
      // If confidence is high enough and domain verified, update application automatically
      if (parsedData.confidence_score >= 0.6 && parsedData.company_name && domainVerified) {
        try {
          console.log("Updating application from email...")
          await updateApplicationFromEmail(parsedData, finalUserEmail)
          console.log("Application updated successfully")
        } catch (updateError) {
          console.error('Failed to update application:', updateError)
          // Continue processing even if update fails
        }
      }

      // Store the email event for tracking
      try {
        console.log("Storing email event...")
        await storeEmailEvent(parsedData, finalUserEmail, emailContent)
        console.log("Email event stored successfully")
      } catch (storeError) {
        console.error('Failed to store email event:', storeError)
        // Continue processing even if storage fails
      }

      return NextResponse.json({
        success: true,
        parsed: parsedData,
        updated: parsedData.confidence_score >= 0.6 && parsedData.company_name && domainVerified,
        domain_verified: domainVerified,
        confidence_score: parsedData.confidence_score,
        company_name: parsedData.company_name,
        interview_stage: parsedData.interview_stage,
        event_type: parsedData.event_type
      })
      
    } catch (error) {
      console.error('Email parsing error:', error)
      return NextResponse.json(
        { error: 'Failed to parse email', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }