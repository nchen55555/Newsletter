import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || "apify_api_hV1hS7dQJMEeIMENotBuTODZmOXB800oI7bo";

interface LinkedInExperience {
  position?: string;
  companyName?: string;
  duration?: string;
  description?: string;
}

interface LinkedInEducation {
  degree?: string;
  fieldOfStudy?: string;
  schoolName?: string;
  period?: string;
}

async function scrapeLinkedInProfile(linkedin_url: string) {
  try {
    // Start Apify scraper
    const startResponse = await fetch(
      `https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileScraperMode: "Profile details no email ($4 per 1k)",
          queries: [linkedin_url]
        })
      }
    );

    console.log('Start response:', startResponse);

    if (!startResponse.ok) {
      throw new Error(`Apify start failed: ${startResponse.statusText}`);
    }

    const { data: runData } = await startResponse.json();
    const runId = runData.id;

    // Poll for completion (max 60 seconds)
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs/${runId}?token=${APIFY_TOKEN}`
      );

      if (!statusResponse.ok) continue;

      const { data: statusData } = await statusResponse.json();
      console.log('Status response:', statusData);

      if (statusData.status === 'SUCCEEDED') {
        // Get dataset items
        const datasetResponse = await fetch(
          `https://api.apify.com/v2/datasets/${statusData.defaultDatasetId}/items?token=${APIFY_TOKEN}`
        );

        if (datasetResponse.ok) {
          const results = await datasetResponse.json();
          return results[0]; // Return first result
        }
      }

      if (statusData.status === 'FAILED' || statusData.status === 'ABORTED') {
        throw new Error(`Scraping ${statusData.status.toLowerCase()}`);
      }

      attempts++;
    }

    throw new Error('Scraping timeout');
  } catch (error) {
    console.error('LinkedIn scraping error:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { linkedin_url, user_id, first_name, last_name } = await req.json();

    if (!linkedin_url) {
      return NextResponse.json({ error: "Missing linkedin_url" }, { status: 400 });
    }

    // Scrape LinkedIn profile
    console.log('Scraping LinkedIn profile:', linkedin_url);
    const profileData = await scrapeLinkedInProfile(linkedin_url);

    console.log('Profile data:', profileData);

    const profilePhoto = profileData?.photo || null;

    // Prepare context for Gemini from scraped data
    let profileContext = '';
    if (profileData) {
      // Extract headline
      const headline = profileData.headline || '';

      // Extract and format experience (top 4 most recent)
      const experiences =
        (profileData.experience as LinkedInExperience[] | undefined)
          ?.slice(0, 4)
          .map((exp: LinkedInExperience) => {
            const position = exp.position ?? '';
            const companyName = exp.companyName ?? '';
            const durationPart = exp.duration ? ` (${exp.duration})` : '';
            const descriptionPart = exp.description ? `: ${exp.description}` : '';
            return `${position} at ${companyName}${durationPart}${descriptionPart}`;
          })
          .join('\n') || 'N/A';

      // Extract and format education
      const education =
        (profileData.education as LinkedInEducation[] | undefined)
          ?.map((edu: LinkedInEducation) => {
            const degree = edu.degree ?? '';
            const field = edu.fieldOfStudy ?? '';
            const school = edu.schoolName ?? '';
            const periodPart = edu.period ? ` (${edu.period})` : '';
            return `${degree || field ? `${degree || ''}${degree && field ? ' in ' : ''}${field || ''} ` : ''}at ${school}${periodPart}`;
          })
          .join('\n') || 'N/A';

      profileContext = `
Headline: ${headline}

Recent Experience:
${experiences}

Education:
${education}
`;
    } else {
      profileContext = `Person's name: ${first_name} ${last_name}\nLinkedIn: ${linkedin_url}\n(Note: Could not retrieve detailed profile data)`;
    }

    console.log('Profile context:', profileContext);

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMENI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const prompt = `You are writing a professional bio for someone's profile. Write in first person, be conversational and engaging.

Here are examples of EXCELLENT bios:

Example 1:
"Hi! I'm Peidong Chen, a senior at Yale studying Computer Science. I love building things that bridge technical depth with real-world impact. Right now, I'm developing an AI scribe that detects bias in clinical notes to make healthcare more equitable."

Example 2:
"I currently am a senior at Harvard College, pursing a Computer Science and Statistics Joint with a concurrent Masters in Computer Science. I'm currently interested in generative modeling the world, specifically 4D world modeling for robotics and the intersection of diffusion models and auction theory."

Now write a bio for this person using their LinkedIn data:

${profileContext}

Write 2-3 sentences. Focus on current work/role and what they're passionate about. Don't mention timelines or dates and no fluff. Just direct aspects of the user. Start with "Hi! I'm [name]" or "I'm a/an..." Make it sound natural and enthusiastic.`;

    console.log('Prompt:', prompt);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 300,
      },
    });

    const bio = result.response.text().trim();

    // Generate LinkedIn embedding asynchronously (don't await)
    if (profileData && user_id) {
      (async () => {
        try {
          console.log('Generating LinkedIn embedding asynchronously');
          const baseUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : process.env.BASE_URL;

          const embeddingResponse = await fetch(`${baseUrl}/api/linkedin_embedding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileData,
              subscriber_id: user_id
            })
          });

          if (embeddingResponse.ok) {
            console.log('LinkedIn embedding generated successfully');
          } else {
            console.error('Failed to generate LinkedIn embedding:', await embeddingResponse.text());
          }
        } catch (error) {
          console.error('Async LinkedIn embedding error:', error);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      profilePhoto,
      bio,
      user_id,
      profileData: profileData ? {
        headline: profileData.headline,
        position: profileData.position,
        education: profileData.education,
        skills: profileData.skills
      } : null
    });
  } catch (err: unknown) {
    console.error("Bio generation error:", err);
    return NextResponse.json(
      {
        error: "Bio generation failed",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
