import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const SIMILARITY_SERVICE_URL = 'https://similarity-service.vercel.app';

type EmbeddingRow = {
  embedding: number[] | string | null;
  subscriber_id: number;
};

type EmbeddingVector = number[];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { ideal_profile_ids, candidate_embeddings } = await request.json();

    if (!Array.isArray(candidate_embeddings) || candidate_embeddings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'candidate_embeddings must be a non-empty array',
        },
        { status: 400 },
      );
    }

    let idealEmployeeEmbeddings: EmbeddingVector[] = [];

    if (Array.isArray(ideal_profile_ids) && ideal_profile_ids.length > 0) {
      const supabase = createRouteHandlerClient({ cookies });

      const { data, error } = await supabase
        .from('github_repository_embeddings')
        .select('embedding, subscriber_id')
        .in('subscriber_id', ideal_profile_ids);

      if (error) {
        console.error('Error fetching ideal employee embeddings:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch ideal employee embeddings',
            details: error.message,
          },
          { status: 500 },
        );
      }
      idealEmployeeEmbeddings = (data || [])
        .map((row: EmbeddingRow) => {
          const e = row.embedding;
          if (Array.isArray(e)) return e as EmbeddingVector;
          if (typeof e === 'string') {
            try {
              const parsed = JSON.parse(e) as unknown;
              return Array.isArray(parsed) ? (parsed as EmbeddingVector) : null;
            } catch {
              return null;
            }
          }
          return null;
        })
        .filter((e): e is EmbeddingVector => Array.isArray(e) && e.length > 0);
    }

    if (!idealEmployeeEmbeddings.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'No ideal employee embeddings found for provided ids',
        },
        { status: 400 },
      );
    }

    const payload = {
      ideal_employee_embeddings: idealEmployeeEmbeddings,
      candidate_embeddings,
    };

    const response = await fetch(`${SIMILARITY_SERVICE_URL}/api/github-similarity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub similarity service responded with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();

    data.runtime = 'nextjs-github-similarity';
    data.proxied_from = 'python-flask';
    data.endpoint_type = 'github-similarity';

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub similarity API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to GitHub similarity service',
        details: error instanceof Error ? error.message : String(error),
        runtime: 'nextjs-github-similarity',
        endpoint_type: 'github-similarity',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${SIMILARITY_SERVICE_URL}/api/github-similarity`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub similarity service responded with status ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();

    data.runtime = 'nextjs-github-similarity';
    data.proxied_from = 'python-flask';
    data.endpoint_type = 'github-similarity';

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub similarity API GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to GitHub similarity service',
        details: error instanceof Error ? error.message : String(error),
        runtime: 'nextjs-github-similarity',
        endpoint_type: 'github-similarity',
      },
      { status: 500 },
    );
  }
}


