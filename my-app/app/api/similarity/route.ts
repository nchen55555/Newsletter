import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    const { skills, top_k = 5, candidate_id, weights, github_similarities } = body;

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

    // Create normalized skills object with defaults for missing dimensions
    const normalizedSkills = {
      systems_infrastructure: skills.systems_infrastructure || 0.0,
      theory_statistics_ml: skills.theory_statistics_ml || 0.0,
      product: skills.product || 0.0,
      github_similarity: skills.github_similarity || 0.0
    };

    // Prepare data for Python script
    const queryData = {
      skills: normalizedSkills,
      top_k,
      weights: weights || null,
      github_similarities: github_similarities || []
    };

    // Path to the model file and Python script
    const modelPath = path.join(process.cwd(), 'app', 'models', 'candidate_matcher_id_only.pkl');
    const pythonScriptPath = path.join(process.cwd(), 'app', 'lib', 'candidate_matcher.py');
    
    // Use python3 executable
    const pythonExecutable = 'python3';
    
    return new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn(pythonExecutable, [
        pythonScriptPath,
        'find_similar',
        modelPath,
        JSON.stringify(queryData),
        candidate_id || ''
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
          resolve(NextResponse.json({
            success: false,
            error: 'Failed to execute similarity calculation',
            details: errorOutput,
            exitCode: code,
            runtime: 'nextjs-local'
          }, { status: 500 }));
          return;
        }

        try {
          const result = JSON.parse(output);
          
          // Add runtime info to distinguish from Vercel Python runtime
          result.runtime = 'nextjs-local';
          
          resolve(NextResponse.json(result));

        } catch (error) {
          console.error('Error parsing Python output:', error);
          resolve(NextResponse.json({
            success: false,
            error: 'Failed to parse similarity calculation results',
            details: output,
            runtime: 'nextjs-local'
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        resolve(NextResponse.json({
          success: false,
          error: 'Failed to start Python process',
          details: error.message,
          runtime: 'nextjs-local'
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Similarity API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      runtime: 'nextjs-local'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Similarity calculation endpoint',
    runtime: 'nextjs-local',
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
  });
}