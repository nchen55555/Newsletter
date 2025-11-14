import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    const { candidate_id, skills } = body;

    // Validate required fields
    if (!candidate_id || typeof candidate_id !== 'string') {
      return NextResponse.json({ 
        error: 'candidate_id is required and must be a string' 
      }, { status: 400 });
    }

    if (!skills || typeof skills !== 'object') {
      return NextResponse.json({ 
        error: 'Skills object is required with systems_infrastructure, theory_statistics_ml, and product scores' 
      }, { status: 400 });
    }

    // Validate skill structure
    const requiredSkills = ['systems_infrastructure', 'theory_statistics_ml', 'product'];
    for (const skill of requiredSkills) {
      if (typeof skills[skill] !== 'number') {
        return NextResponse.json({ 
          error: `Missing or invalid ${skill} score` 
        }, { status: 400 });
      }
    }

    // Path to the model file
    const modelPath = path.join(process.cwd(), 'app', 'models', 'candidate_matcher_id_only.pkl');
    const pythonScriptPath = path.join(process.cwd(), 'app', 'lib', 'candidate_matcher.py');

    // Prepare Python command
    const skillsJson = JSON.stringify(skills);
    
    return new Promise<NextResponse>((resolve) => {
      const pythonProcess = spawn('python3', [
        pythonScriptPath,
        'add_candidate',
        modelPath,
        candidate_id,
        skillsJson
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
          console.error('Python script error:', errorOutput);
          resolve(NextResponse.json({ 
            error: 'Failed to add candidate to model',
            details: errorOutput 
          }, { status: 500 }));
          return;
        }

        try {
          const result = JSON.parse(output);
          
          if (!result.success) {
            resolve(NextResponse.json({ 
              error: 'Adding candidate failed',
              details: result.error 
            }, { status: 500 }));
            return;
          }

          resolve(NextResponse.json({
            success: true,
            message: result.message,
            database_size: result.database_size,
            candidate_id: candidate_id,
            skills: skills
          }));

        } catch (error) {
          console.error('Error parsing Python output:', error);
          resolve(NextResponse.json({ 
            error: 'Failed to parse add candidate results',
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
        candidate_id: 'string (unique identifier)',
        skills: {
          systems_infrastructure: 'number',
          theory_statistics_ml: 'number', 
          product: 'number'
        }
      }
    }
  }, { status: 405 });
}