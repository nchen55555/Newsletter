import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {

    // curl -X POST "http://localhost:3000/api/post_generated_interest_profile?service_role_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVib21wanNsY2ZnYmtpZG1mdXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg3NjYyMiwiZXhwIjoyMDY4NDUyNjIyfQ.q7p1OvO1bDTXREHNXc7MUURpmdcgsIVCeLmPmUL-XhY" \
    // -H "Content-Type: application/json" \
    // -d '{
    //   "interest_companies_indices": [5, 7, 4],
    //   "interest": "AI, Research",
    //   "bio": "Physics + CS @ MIT | U.S. IPhO Team + Gold Medalist | STS Finalist | MOP | RSI",
    //   "resume": "https://ubompjslcfgbkidmfuym.supabase.co/storage/v1/object/public/resume_files/e68134fe-1a19-4678-9c53-7cd28e8dcdb5/resume.pdf",
    //   "email": "lukehuang001@gmail.com"
    // }'
    try {
        const body = await request.json()
        const { interest_companies, interest, bio, resume, email} = body

        // Validate required fields
        if (!interest_companies || !interest || !bio || !resume) {
            return NextResponse.json(
                { error: 'Missing required fields: interest_companies_indices, interest, bio, resume' },
                { status: 400 }
            )
        }

        const supabase = createRouteHandlerClient({ cookies })
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
        }

        // Validate that the user actually exists in Supabase Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            await supabase.auth.signOut()
            return NextResponse.json({ error: 'User not found' }, { status: 401 })
        }

        // Fetch company information from Supabase using the indices
        let companyInfo = ""
        const { data } = await supabase
            .from('subscribers')
            .select('bookmarked_companies')
            .eq('email', email)
            .single()
        const interest_companies_indices = data?.bookmarked_companies

        if (interest_companies_indices && interest_companies_indices.length > 0) {
            const { data: companies, error: companiesError } = await supabase
                .from('companies') // Assuming there's a companies table
                .select('id, company_name, keywords')
                .in('id', interest_companies_indices)

            if (!companiesError && companies && companies.length > 0) {
                companyInfo = companies.map(company => 
                    `${company.company_name}: ${company.keywords || 'No description available'}`
                ).join('\n')
            }
        }

        const { data: all_companies, error: allCompaniesError } = await supabase
            .from('companies') // Assuming there's a companies table
            .select('id, company_name, keywords')

        let allCompanyInfo = ""
        if (!allCompaniesError && all_companies && all_companies.length > 0) {
            allCompanyInfo = all_companies.map(company => 
                `${company.company_name}: ${company.keywords || 'No description available'}`
            ).join('\n')
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMENI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Create the prompt for Gemini
        const prompt = `
        Based on the following information about a person, generate 5 concise data points about what they are good at and what their interests are in terms of opportunities they should be looking for.

        **Bio:** ${bio}
        
        **Resume/Background:** ${resume}
        
        **Companies They're Interested In:** 
        ${companyInfo || 'No specific companies provided'} on The Niche. They are also interested in ${interest_companies} but index less on this.

        This is what they are looking for **Stated Interests:** ${interest}

        Please provide exactly 5 bullet points that are minimal fluff structured as: 
        1. First bullet point talking about technical strengths: for example, strong systems background, strong mathematical/theoretical background, etc.
        2. One bullet point for specific industries such as FinTech, AI/ML, Defense Tech, GovTech, etc. that the candidate would be interested in.  
        5. The three bullet point to select 3-4 of the company names (not keywords and descriptions) ${allCompanyInfo} the candidate would be interested in, ranking them from best to worst 
        
        Format as plain text with bullet points (•).
        `

        // Generate content using Gemini
        const result = await model.generateContent(prompt)
        const response = await result.response
        const generatedProfile = response.text()

        // Update the user's profile in Supabase
        const { error: updateError } = await supabase
            .from('subscribers')
            .update({ 
                generated_interest_profile: generatedProfile,
            })
            .eq('email', email)

        if (updateError) throw updateError

        return NextResponse.json({ 
            success: true,
            generated_interest_profile: generatedProfile
        })

    } catch (error) {
        console.error('Error generating interest profile:', error)
        return NextResponse.json(
            { error: 'Error generating interest profile' },
            { status: 500 }
        )
    }
}