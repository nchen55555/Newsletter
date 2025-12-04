import { NextRequest, NextResponse } from 'next/server';

const SIMILARITY_SERVICE_URL = 'https://similarity-service.vercel.app';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get request body and forward it to the Python similarity service
    const body = await request.json();
    
    const response = await fetch(`${SIMILARITY_SERVICE_URL}/api/network-similarity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Network similarity service responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Add runtime info to distinguish this specific endpoint
    data.runtime = 'nextjs-network-similarity';
    data.proxied_from = 'python-flask';
    data.endpoint_type = 'network-similarity';
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Network similarity API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to similarity service',
      details: error instanceof Error ? error.message : String(error),
      runtime: 'nextjs-network-similarity',
      endpoint_type: 'network-similarity'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Forward GET requests to the Python similarity service
    const response = await fetch(`${SIMILARITY_SERVICE_URL}/api/network-similarity`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Network similarity service responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Add runtime info
    data.runtime = 'nextjs-network-similarity';
    data.proxied_from = 'python-flask';
    data.endpoint_type = 'network-similarity';
    data.message = 'Network similarity calculation endpoint';
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Network similarity API GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to similarity service',
      details: error instanceof Error ? error.message : String(error),
      runtime: 'nextjs-network-similarity',
      endpoint_type: 'network-similarity'
    }, { status: 500 });
  }
}