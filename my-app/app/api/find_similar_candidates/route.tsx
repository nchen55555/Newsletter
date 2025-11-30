import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { skills, top_k = 5, candidate_id, weights, mode, repository_embeddings } = body;

    // Validate required fields
    if (!skills || typeof skills !== 'object') {
      return NextResponse.json({ 
        error: 'Skills object is required with at least one skill dimension' 
      }, { status: 400 });
    }


    // Check if we have at least one valid skill dimension
    const academicSkills = ['systems_infrastructure', 'theory_statistics_ml', 'product'];
    const hasAcademicSkills = academicSkills.some(skill => typeof skills[skill] === 'number');
    
    if (!hasAcademicSkills) {
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
    
    // Create normalized skills object with defaults for missing dimensions
    const normalizedSkills = {
      systems_infrastructure: skills.systems_infrastructure || 0.0,
      theory_statistics_ml: skills.theory_statistics_ml || 0.0,
      product: skills.product || 0.0,
    };



    // Prepare request data for Python API
    const requestData = {
      skills: normalizedSkills,
      top_k,
      weights: weights || null,
      candidate_id: candidate_id || undefined,
      // Do NOT mutate the underlying similarity model from this endpoint by default
      add_to_model: false,
      repository_embeddings: repository_embeddings || [],
      mode: mode || undefined,
    };

    // Only forward mode if explicitly provided by the caller
    if (mode) {
      requestData.mode = mode;
    }

    if (Array.isArray(repository_embeddings) && repository_embeddings.length > 0) {
      requestData.repository_embeddings = repository_embeddings;
    }


    try {
      const pythonStartTime = Date.now();
      console.log('🐍 Starting Python API call at:', new Date().toISOString());
      console.log('📊 Request data:', JSON.stringify(requestData, null, 2));

      // Call the candidate similarity proxy endpoint
      // Use localhost for development, production URL for production
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction 
        ? (process.env.NEXT_PUBLIC_BASE_URL || 'https://theniche.tech')
        : 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/candidate-similarity`;
        
      console.log('🌐 Calling API URL:', apiUrl);

      const pythonResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const totalTime = Date.now() - startTime;
      const pythonTime = Date.now() - pythonStartTime;

      console.log('🏁 Python API finished');
      console.log('⏱️ Total execution time:', totalTime + 'ms');
      console.log('🐍 Python execution time:', pythonTime + 'ms');

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.text();
        console.error('Python API error:', errorData);
        return NextResponse.json({ 
          error: 'Failed to find similar candidates',
          details: errorData,
          executionTime: totalTime,
          pythonExecutionTime: pythonTime
        }, { status: 500 });
      }

      const result = await pythonResponse.json();
      
      if (!result.success) {
        return NextResponse.json({ 
          error: 'Candidate matching failed',
          details: result.error 
        }, { status: 500 });
      }

      // Return the result with timing information
      return NextResponse.json({
        success: true,
        matches: result.matches || [],
        database_size: result.database_size || 0,
        query_skills: result.query_skills,
        candidate_added: result.candidate_added || false,
        candidate_action: result.candidate_action || 'none',
        executionTime: totalTime,
        pythonExecutionTime: pythonTime,
        timestamp: new Date().toISOString(),
        runtime: result.runtime || 'python'
      });

    } catch (fetchError) {
      const totalTime = Date.now() - startTime;
      console.error('Error calling Python API:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to call Python similarity API',
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        executionTime: totalTime
      }, { status: 500 });
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Unexpected error after', totalTime + 'ms:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error),
      executionTime: totalTime
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