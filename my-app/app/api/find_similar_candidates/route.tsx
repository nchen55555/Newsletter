import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import path from 'path';

interface GitHubSimilarity {
  similarity: number;
  id: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    const { skills, top_k = 5, candidate_id, weights } = body;

    // Initialize Supabase for GitHub similarity lookups
    const supabase = createRouteHandlerClient({ cookies });

    // Validate required fields
    if (!skills || typeof skills !== 'object') {
      return NextResponse.json({ 
        error: 'Skills object is required with at least one skill dimension' 
      }, { status: 400 });
    }

    // Check if we have at least one valid skill dimension
    const academicSkills = ['systems_infrastructure', 'theory_statistics_ml', 'product'];
    const hasAcademicSkills = academicSkills.some(skill => typeof skills[skill] === 'number');
    const hasGithubSimilarity = typeof skills.github_similarity === 'number';
    
    if (!hasAcademicSkills && !hasGithubSimilarity) {
      return NextResponse.json({ 
        error: 'At least one skill dimension is required (academic skills or github_similarity)' 
      }, { status: 400 });
    }

    // Validate academic skill structure if present
    for (const skill of academicSkills) {
      if (skills[skill] !== undefined && typeof skills[skill] !== 'number') {
        return NextResponse.json({ 
          error: `Invalid ${skill} score - must be a number` 
        }, { status: 400 });
      }
    }
    
    // Validate GitHub similarity if present
    if (skills.github_similarity !== undefined && typeof skills.github_similarity !== 'number') {
      return NextResponse.json({ 
        error: 'Invalid github_similarity score - must be a number between 0 and 1' 
      }, { status: 400 });
    }

    // Fetch GitHub similarities if we have a candidate_id
    let githubSimilarities: GitHubSimilarity[] = [];
    if (candidate_id) {
      try {
        const { data: matches, error: rpcError } = await supabase.rpc('github_match_id', {
          target_id: parseInt(candidate_id),
          k: 50,
          exclude_self: true
        });

        if (rpcError) {
          console.error('GitHub similarity RPC error:', rpcError);
        } else {
          // Filter out any similarities with null values and ensure we have valid similarities
          const validSimilarities = (matches || []).filter((match: GitHubSimilarity) => 
            match && 
            typeof match.similarity === 'number' && 
            !isNaN(match.similarity) &&
            match.id !== parseInt(candidate_id) // Exclude self-matches
          );
          
          githubSimilarities = validSimilarities;
          console.log(`Found ${githubSimilarities.length} valid GitHub similarities for candidate ${candidate_id} (from ${(matches || []).length} total)`);
          
          if (githubSimilarities.length > 0) {
            console.log('Sample valid GitHub similarity:', githubSimilarities[0]);
          } else {
            console.log('No valid GitHub similarities found - proceeding without GitHub matching');
          }
        }
      } catch (error) {
        console.error('Error fetching GitHub similarities:', error);
        // Continue without GitHub similarities
      }
    }

    // Create normalized skills object with defaults for missing dimensions
    const normalizedSkills = {
      systems_infrastructure: skills.systems_infrastructure || 0.0,
      theory_statistics_ml: skills.theory_statistics_ml || 0.0,
      product: skills.product || 0.0,
      github_similarity: skills.github_similarity || 0.0
    };

    // Set github_similarity if we have valid GitHub similarities available and it wasn't provided
    if (candidate_id && !skills.github_similarity && githubSimilarities.length > 0) {
      normalizedSkills.github_similarity = 1.0; // Perfect match to themselves
    }

    // Path to the model file
    const modelPath = path.join(process.cwd(), 'app', 'models', 'candidate_matcher_id_only.pkl');
    const pythonScriptPath = path.join(process.cwd(), 'app', 'lib', 'candidate_matcher.py');

    // Prepare Python command - use virtual environment if available
    const queryData = {
      skills: normalizedSkills,
      top_k,  // Include top_k in the query data
      weights: weights || null,
      github_similarities: githubSimilarities // Include GitHub similarities for processing
    };
    const queryJson = JSON.stringify(queryData);
    const pythonExecutable = process.env.NODE_ENV === 'production' ? 'python3' : path.join(process.cwd(), 'venv', 'bin', 'python');
    
    return new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn(pythonExecutable, [
        pythonScriptPath,
        'find_similar',
        modelPath,
        queryJson,
        candidate_id || ''  // Pass candidate_id directly in the first call
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error (exit code', code, '):', errorOutput);
          console.error('Python script output:', output);
          resolve(NextResponse.json({ 
            error: 'Failed to find similar candidates',
            details: errorOutput,
            pythonOutput: output,
            exitCode: code
          }, { status: 500 }));
          return;
        }

        try {
          const result = JSON.parse(output);
          
          if (!result.success) {
            resolve(NextResponse.json({ 
              error: 'Candidate matching failed',
              details: result.error 
            }, { status: 500 }));
            return;
          }

          // Return the result (candidate addition is handled in the Python script)
          resolve(NextResponse.json({
            success: true,
            matches: result.matches || [],
            database_size: result.database_size || 0,
            query_skills: result.query_skills,
            candidate_added: result.candidate_added || false,
            candidate_action: result.candidate_action || 'none'
          }));

        } catch (error) {
          console.error('Error parsing Python output:', error);
          resolve(NextResponse.json({ 
            error: 'Failed to parse matching results',
            details: output 
          }, { status: 500 }));
        }
      });
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed', 
    message: 'This endpoint only supports POST requests',
    usage: {
      method: 'POST',
      body: {
        skills: {
          systems_infrastructure: 'number (optional, academic skills)',
          theory_statistics_ml: 'number (optional, academic skills)', 
          product: 'number (optional, academic skills)',
          github_similarity: 'number (optional, 0-1, technical skills)',
          note: 'At least one skill dimension (academic or github) is required'
        },
        top_k: 'number (optional, default: 5)',
        candidate_id: 'string (optional, adds candidate to model)',
        weights: {
          systems_infrastructure: 'number (optional, default: 1.0)',
          theory_statistics_ml: 'number (optional, default: 1.0)', 
          product: 'number (optional, default: 1.0)',
          github_similarity: 'number (optional, default: 1.0)'
        }
      }
    }
  }, { status: 405 });
}