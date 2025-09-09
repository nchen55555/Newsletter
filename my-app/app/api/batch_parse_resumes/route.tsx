import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

// COMMAND: curl -X POST "http://localhost:3000/api/batch_parse_resumes?service_role_key="

const SYSTEM_INSTRUCTIONS = `
You are a resume parser. Read the resume PDF and normalize into JSON.
- Extract clean Education and Experience sections.
- Merge stray month lines into jobs.
- Normalize dates like "Jan 2024 – May 2024".
- Split bullets into summary_bullets arrays.
- Do NOT invent information.
- Limit to only the most recent experiences, so you can remove if there are more than 5 experiences already.
Return JSON only, matching schema.
`;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  required: ["experience", "education"],
  properties: {
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["company", "role", "dates"],
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          dates: { type: SchemaType.STRING },
          summary_bullets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
      }
    },
    education: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  }
};

async function parseResumeWithGemini(resumeUrl: string) {
  try {
    // Download the PDF
    const resp = await fetch(resumeUrl);
    if (!resp.ok) {
      throw new Error("Failed to fetch resume PDF");
    }
    const buffer = Buffer.from(await resp.arrayBuffer());

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMENI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTIONS,
    });

    // Send PDF as inlineData
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = result.response.text();
    const normalized = JSON.parse(jsonText);
    
    return { success: true, data: normalized };
  } catch (error) {
    console.error("Gemini parsing error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function POST(request: Request) {
  try {
    // Get service role key from request body or headers
    const { searchParams } = new URL(request.url);
    const serviceRoleKey = searchParams.get('service_role_key') || request.headers.get('x-service-role-key');
    
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key is required. Pass as ?service_role_key=... or X-Service-Role-Key header' }, { status: 400 });
    }

    // Use service role client to bypass RLS for administrative tasks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
    
    // Find all subscribers with resumes but no parsed_resume_json
    const { data: profiles, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, email, first_name, last_name, resume_url, parsed_resume_json')
      .not('resume_url', 'is', null)
      .is('parsed_resume_json', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
        message: 'No profiles found that need parsing',
        processed: 0,
        total: 0
      });
    }
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    // Process each profile
    for (const profile of profiles) {
      
      const parseResult = await parseResumeWithGemini(profile.resume_url);
      
      if (parseResult.success) {
        // Update the profile with parsed data
        const { data: updateData, error: updateError } = await supabase
          .from('subscribers')
          .update({ parsed_resume_json: JSON.stringify(parseResult.data) })
          .eq('id', profile.id)
          .select();

        if (updateError) {
          console.error(`Failed to update profile ${profile.id}:`, updateError);
          errorCount++;
          results.push({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            status: 'update_failed',
            error: updateError.message
          });
        } else {
          console.log(`Database update result for profile ${profile.id}:`, updateData);
          successCount++;
          results.push({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            status: 'success'
          });
          console.log(`✅ Successfully processed profile ${profile.id}`);
        }
      } else {
        errorCount++;
        results.push({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          status: 'parse_failed',
          error: parseResult.error
        });
        console.error(`❌ Failed to parse profile ${profile.id}:`, parseResult.error);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      message: `Batch processing completed`,
      total: profiles.length,
      successful: successCount,
      failed: errorCount,
      results: results
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { error: 'Batch processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check how many profiles need parsing
export async function GET() {
  try {
    // Use service role client to bypass RLS for administrative tasks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Count profiles that need parsing
    const { count, error } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .not('resume_url', 'is', null)
      .is('parsed_resume_json', null);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      profiles_needing_parsing: count || 0,
      message: count === 0 ? 'All profiles with resumes have been parsed' : `${count} profiles need parsing`
    });

  } catch (error) {
    console.error('Error checking profiles:', error);
    return NextResponse.json(
      { error: 'Failed to check profiles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
