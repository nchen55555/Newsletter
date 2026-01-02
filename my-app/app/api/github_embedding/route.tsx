import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Create embedding text from repository files with adaptive budgeting
function createRepositoryEmbeddingText(repoGroup: {
  repositoryName: string;
  repositoryFullName: string;
  fileCount: number;
  contributionType: string;
  primaryLanguage?: string;
  files: Array<{
    filename: string;
    content: string;
    path: string;
    size: number;
  }>;
}): string {
  // Adaptive budget based on repository size
  let repoBaseBudget;
  if (repoGroup.fileCount <= 3) {
    repoBaseBudget = Math.min(20000, repoGroup.fileCount * 8000); // Small repos: proportional, max 20KB
  } else if (repoGroup.fileCount <= 10) {
    repoBaseBudget = 50000; // Medium repos: 50KB
  } else {
    repoBaseBudget = 75000; // Large repos: 75KB
  }
  
  // Distribute budget per file, but cap individual files
  const budgetPerFile = Math.min(
    Math.floor(repoBaseBudget / repoGroup.fileCount),
    25000 // Max 25KB per individual file
  );
  

  const embeddingParts = [
    `Repository: ${repoGroup.repositoryFullName}`,
    `Contribution Type: ${repoGroup.contributionType}`,
    `Files Contributed: ${repoGroup.fileCount}`,
    ''
  ];

  // Include actual code content from files they contributed to
  repoGroup.files.forEach(file => {
    embeddingParts.push(`--- File: ${file.path} ---`);
    
    // Apply per-file budget with smart truncation
    let fileContent = file.content;
    if (fileContent.length > budgetPerFile) {
      const beginningChars = Math.floor(budgetPerFile * 0.7);
      const endingChars = budgetPerFile - beginningChars - 50;
      
      fileContent = fileContent.substring(0, beginningChars) + 
                   '\n\n... [content truncated] ...\n\n' + 
                   fileContent.substring(fileContent.length - endingChars);
    }
    
    embeddingParts.push(fileContent);
    embeddingParts.push(''); // Separator between files
  });

  return embeddingParts.join('\n');
}

// Analyze technologies using Gemini with model cycling and rate limit handling
async function analyzeTechnologies(embeddingText: string, geminiApiKey: string) {
  const modelNames = [
    'gemini-2.5-pro',
    'gemini-2.5-flash', 
    'gemini-2.0-flash-001',
    'gemini-2.5-flash-lite'
  ];

  const prompt = `Analyze this code repository content and identify:
- Programming languages used
- Frameworks/libraries imported 
- Database technologies
- Architectural patterns
- Key packages/dependencies
- Programming interests (what domains/problems they're solving)
- Skill level assessment (beginner/intermediate/advanced based on code complexity, patterns used)
- Background indicators (academic projects, professional work, personal experiments, open source contributions)

Return ONLY valid JSON:
{
  "technologies": {
    "languages": [],
    "frameworks": [], 
    "databases": [],
    "packages": [],
    "patterns": []
  },
  "assessment": {
    "interests": [],
    "skill_level": "",
    "background": ""
  },
  "summary": ""
}

Repository content:
${embeddingText}`;

  // Try each model in sequence
  for (const modelName of modelNames) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
      });

      if (response.status === 429) continue; // Try next model
      if (!response.ok) continue;

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      continue; // Try next model
    }
  }

  // All models failed - wait and retry once
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // One final attempt
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch {}

  return {
    technologies: { languages: [], frameworks: [], databases: [], packages: [], patterns: [] },
    assessment: { interests: [], skill_level: "unknown", background: "unknown" },
    summary: "Unable to analyze technologies"
  };
}

export async function POST(request: NextRequest) {
  try {
    const { data, subscriberId } = await request.json();
    
    if (!data) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    if (!subscriberId) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const voyageApiKey = process.env.VOYAGE_API_KEY;
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMENI_API_KEY;
    
    if (!voyageApiKey) {
      return NextResponse.json({ error: 'Voyage API key not configured' }, { status: 500 });
    }
    
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Check for service role key in authorization header
    const authHeader = request.headers.get('authorization');
    let supabase;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const serviceKey = authHeader.replace('Bearer ', '');
      
      // Use service role client (bypasses RLS)
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
      );
    } else {
      // Fallback to regular authenticated client
      supabase = createRouteHandlerClient({ cookies });
    }

    // Process repository groups - this is our new primary approach
    if (data.repositoryGroups && data.repositoryGroups.length > 0) {
      
      const repositoryEmbeddings = [];
      
      for (const repoGroup of data.repositoryGroups) {
        const embeddingText = createRepositoryEmbeddingText(repoGroup);
        
        try {
          // Generate embedding
          const voyageResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${voyageApiKey}`
            },
            body: JSON.stringify({
              input: [embeddingText],
              model: 'voyage-code-3'
            })
          });

          if (!voyageResponse.ok) {
            console.error(`Failed to generate embedding for ${repoGroup.repositoryName}:`, await voyageResponse.text());
            continue;
          }

          const voyageResult = await voyageResponse.json();
          const embedding = voyageResult.data[0].embedding;
          
          // Analyze technologies using the same content
          const techAnalysis = await analyzeTechnologies(embeddingText, geminiApiKey);
          
          repositoryEmbeddings.push({
            repositoryName: repoGroup.repositoryName,
            repositoryFullName: repoGroup.repositoryFullName,
            contributionType: repoGroup.contributionType,
            fileCount: repoGroup.fileCount,
            embedding: embedding,
            embeddingText: embeddingText,
            technologies: techAnalysis.technologies,
            assessment: techAnalysis.assessment,
            summary: techAnalysis.summary
          });
          
        } catch (embeddingError) {
          console.error(`Error generating embedding for ${repoGroup.repositoryName}:`, embeddingError);
          continue;
        }
      }

      if (repositoryEmbeddings.length === 0) {
        return NextResponse.json({ 
          error: 'Failed to generate any repository embeddings' 
        }, { status: 500 });
      }

      // Upsert repository embeddings - update existing or insert new
      for (const repoEmbedding of repositoryEmbeddings) {
        const { error: upsertError } = await supabase
          .from('github_repository_embeddings')
          .upsert({
            subscriber_id: subscriberId,
            repository_name: repoEmbedding.repositoryFullName, // Use full path
            contribution_type: repoEmbedding.contributionType,
            file_count: repoEmbedding.fileCount,
            embedding: repoEmbedding.embedding,
            embedding_text: repoEmbedding.embeddingText,
            technologies: repoEmbedding.technologies,
            assessment: repoEmbedding.assessment,
            summary: repoEmbedding.summary,
            last_analyzed_commit: data.lastAnalyzedCommit, // From analyzer
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'subscriber_id,repository_name'
          });

        if (upsertError) {
          console.error(`Failed to upsert embedding for ${repoEmbedding.repositoryName}:`, upsertError);
        }
      }

      // Update subscribers metadata
      const { error: metadataError } = await supabase
        .from('subscribers')
        .update({
          embedding_metadata: {
            username: data.username,
            totalRepositories: data.totalRepositories,
            totalRepositoryGroups: repositoryEmbeddings.length,
            analysisDate: data.analysisDate,
            contributionSummary: data.contributionSummary
          }
        })
        .eq('id', subscriberId);

      if (metadataError) {
        console.error('Failed to update metadata:', metadataError);
        // Don't fail the request for metadata errors
      }

      // Return success with repository embeddings info
      return NextResponse.json({
        success: true,
        repositoryEmbeddingsGenerated: repositoryEmbeddings.length,
        repositoryNames: repositoryEmbeddings.map(re => re.repositoryName),
        embeddingGenerated: true,
        subscriberId
      });

    } else {
      // No repository groups found - this means no files were successfully processed
      
      return NextResponse.json({
        success: false,
        error: 'No repository data available for embedding generation',
        embeddingGenerated: false,
        subscriberId
      });
    }

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error generating GitHub profile embedding:', error);
    return NextResponse.json({ 
      error: 'Failed to generate embedding',
      details: err.message || 'Unknown error'
    }, { status: 500 });
  }
}