import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = "nodejs";

interface LinkedInExperience {
  title?: string;
  company?: string;
  duration?: string;
}

interface LinkedInEducation {
  schoolName?: string;
  degreeName?: string;
  fieldOfStudy?: string;
}

interface LinkedInProject {
  title?: string;
  description?: string;
}

interface LinkedInAward {
  title?: string;
  name?: string;
  issuer?: string;
}

interface LinkedInProfileData {
  currentPosition?: string;
  headline?: string;
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  skills?: string[];
  projects?: LinkedInProject[];
  honorsAndAwards?: LinkedInAward[];
}

export async function POST(req: NextRequest) {
  try {
    const { profileData, subscriber_id } = await req.json();

    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    if (!subscriber_id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.NEXT_PUBLIC_GEMENI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Initialize Google GenAI client
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004'});

    // Extract and format specific career-relevant fields
    const formatFieldsForEmbedding = (data: LinkedInProfileData): string => {
      const parts: string[] = [];

      // Current position and headline
      if (data.currentPosition) {
        parts.push(`Current Position: ${data.currentPosition}`);
      }
      if (data.headline) {
        parts.push(`Headline: ${data.headline}`);
      }

      // Experience
      if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
        parts.push('\nExperience:');
        data.experience.forEach((exp: LinkedInExperience) => {
          const title = exp.title || 'Unknown';
          const company = exp.company || 'Unknown';
          const duration = exp.duration || '';
          parts.push(`- ${title} at ${company} ${duration}`);
        });
      }

      // Education
      if (data.education && Array.isArray(data.education) && data.education.length > 0) {
        parts.push('\nEducation:');
        data.education.forEach((edu: LinkedInEducation) => {
          const school = edu.schoolName || 'Unknown';
          const degree = edu.degreeName || '';
          const field = edu.fieldOfStudy || '';
          parts.push(`- ${school}${degree ? ` - ${degree}` : ''}${field ? ` in ${field}` : ''}`);
        });
      }

      // Skills
      if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        parts.push('\nSkills:');
        parts.push(data.skills.join(', '));
      }

      // Projects
      if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
        parts.push('\nProjects:');
        data.projects.forEach((project: LinkedInProject) => {
          const title = project.title || 'Unnamed Project';
          const description = project.description || '';
          parts.push(`- ${title}${description ? `: ${description}` : ''}`);
        });
      }

      // Honors and Awards
      if (data.honorsAndAwards && Array.isArray(data.honorsAndAwards) && data.honorsAndAwards.length > 0) {
        parts.push('\nHonors and Awards:');
        data.honorsAndAwards.forEach((award: LinkedInAward) => {
          const title = award.title || award.name || 'Award';
          const issuer = award.issuer || '';
          parts.push(`- ${title}${issuer ? ` by ${issuer}` : ''}`);
        });
      }

      return parts.join('\n');
    };

    const formattedProfile = formatFieldsForEmbedding(profileData);

    // Generate embedding from formatted career-relevant fields
    const response = await model.embedContent(formattedProfile);

    const embedding = response.embedding?.values ?? [];

    console.log('Embedding generated successfully');

    // Store embedding in subscribers table
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        linkedin_embeddings: embedding,
        scraped_linkedin: profileData,
      })
      .eq('id', subscriber_id);

    if (updateError) {
      console.error('Failed to update subscriber with embedding:', updateError);
      return NextResponse.json({
        error: 'Failed to store embedding',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscriber_id,
      embeddingGenerated: true
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error generating LinkedIn embedding:', error);
    return NextResponse.json({
      error: 'Failed to generate LinkedIn embedding',
      details: err.message || 'Unknown error'
    }, { status: 500 });
  }
}
