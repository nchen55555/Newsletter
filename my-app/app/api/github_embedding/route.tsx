import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GitHubProfileAnalysis, AnalyzedRepository } from '../../types/github-analysis';

function createEmbeddingText(data: GitHubProfileAnalysis): string {
  const { username, totalRepositories, overallTechnologies, topRepositories, analyzedRepositories, contributionSummary } = data;
  
  const embeddingParts = [
    `GitHub Profile: ${username}`,
    `Total Repositories: ${totalRepositories}`,
    `Programming Languages: ${overallTechnologies.languages.join(', ')}`,
    `Frameworks: ${overallTechnologies.frameworks.join(', ')}`,
    `Libraries: ${overallTechnologies.libraries.join(', ')}`,
    `Databases: ${overallTechnologies.databases.join(', ')}`,
    `Cloud Services: ${overallTechnologies.cloudServices.join(', ')}`,
    `DevOps Tools: ${overallTechnologies.devOps.join(', ')}`,
    `Architectural Patterns: ${overallTechnologies.architecturalPatterns.join(', ')}`,
  ];

  if (topRepositories && topRepositories.length > 0) {
    embeddingParts.push('Notable Projects:');
    topRepositories.forEach(repo => {
      const repoInfo = [
        `${repo.name}${repo.description ? `: ${repo.description}` : ''}`,
        `Technologies: ${[
          ...repo.technologies.languages,
          ...repo.technologies.frameworks,
          ...repo.technologies.libraries,
          ...repo.technologies.databases,
          ...repo.technologies.cloudServices,
          ...repo.technologies.architecturalPatterns
        ].filter(Boolean).join(', ')}`,
        repo.stars > 0 ? `Stars: ${repo.stars}` : '',
      ].filter(Boolean).join(' | ');
      
      embeddingParts.push(repoInfo);
    });
  }

  const recentActivity = analyzedRepositories
    .map(repo => new Date(repo.lastUpdated))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  
  if (recentActivity) {
    embeddingParts.push(`Most Recent Activity: ${recentActivity.toDateString()}`);
  }

  const totalStars = analyzedRepositories.reduce((sum, repo) => sum + repo.stars, 0);
  if (totalStars > 0) {
    embeddingParts.push(`Total GitHub Stars: ${totalStars}`);
  }

  // Add contribution activity information
  if (contributionSummary) {
    embeddingParts.push(`Open Source Activity:`);
    embeddingParts.push(`Total Recent Activities: ${contributionSummary.totalActivities}`);
    embeddingParts.push(`Open Source Contributions: ${contributionSummary.openSourceContributions}`);
    
    if (contributionSummary.openSourceContributions > 0) {
      const activityTypes = Object.entries(contributionSummary.contributionsByType)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => `${count} ${type.replace('_', ' ')}${count > 1 ? 's' : ''}`)
        .join(', ');
      
      if (activityTypes) {
        embeddingParts.push(`Activity Types: ${activityTypes}`);
      }

      // Include notable open source repositories they've contributed to
      const openSourceRepos = contributionSummary.activeRepositories
        .filter(repo => !data.analyzedRepositories.some(own => own.name === repo.split('/')[1]))
        .slice(0, 5); // Limit to top 5 external repos
        
      if (openSourceRepos.length > 0) {
        embeddingParts.push(`Contributes to: ${openSourceRepos.join(', ')}`);
      }
    }
  }

  return embeddingParts.filter(Boolean).join('\n');
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

    const apiKey = process.env.NEXT_PUBLIC_GEMENI_API_KEY;
    if (!apiKey) {
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
      console.log('Using service role client for embedding generation');
    } else {
      // Fallback to regular authenticated client
      supabase = createRouteHandlerClient({ cookies });
    }

    const embeddingText = createEmbeddingText(data);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const result = await model.embedContent(embeddingText);
    const embedding = result.embedding;

    const metadata = {
      username: data.username,
      totalRepositories: data.totalRepositories,
      languages: data.overallTechnologies?.languages || [],
      frameworks: data.overallTechnologies?.frameworks || [],
      libraries: data.overallTechnologies?.libraries || [],
      databases: data.overallTechnologies?.databases || [],
      cloudServices: data.overallTechnologies?.cloudServices || [],
      devOps: data.overallTechnologies?.devOps || [],
      architecturalPatterns: data.overallTechnologies?.architecturalPatterns || [],
      totalStars: data.analyzedRepositories?.reduce((sum: number, repo: AnalyzedRepository) => sum + repo.stars, 0) || 0,
      analysisDate: data.analysisDate,
      topRepositoriesCount: data.topRepositories?.length || 0,
      openSourceContributions: data.contributionSummary?.openSourceContributions || 0,
      totalActivities: data.contributionSummary?.totalActivities || 0,
      contributionTypes: data.contributionSummary?.contributionsByType || {},
      activeRepositories: data.contributionSummary?.activeRepositories || []
    };

    // Save to Supabase
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        github_vector_embeddings: embedding.values,
        embedding_text: embeddingText,
        embedding_metadata: metadata
        
      })
      .eq('id', subscriberId);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to save embedding data',
        details: updateError.message
      }, { status: 500 });
    }

    const queryVector = result.embedding.values as number[];

    const { data: matches, error: rpcError } = await supabase.rpc('github_match_subscribers', {
      q: queryVector,
      k: 5,
      exclude_id: subscriberId, // optional
    });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return NextResponse.json({ error: 'Similarity search failed', details: rpcError.message }, { status: 500 });
    }


    // 3) Return the ranked results
    return NextResponse.json({
      success: true,
      queryVectorLength: queryVector.length,
      topk: 5,
      matches, // [{ id, similarity, username, metadata }, ...]
      embeddingGenerated: true, // Signal that embeddings were successfully created
      subscriberId // Include subscriber ID for frontend tracking
    });
    

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error generating GitHub profile embedding:', error);
    return NextResponse.json({ 
      error: 'Failed to generate embedding',
      details: err.message || 'Unknown error'
    }, { status: 500 });
  }
}