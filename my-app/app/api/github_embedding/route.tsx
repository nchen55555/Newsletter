import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GitHubProfileAnalysis, TechnologyDetection } from '../../types/github-analysis';

const extractTechNames = (techs: (string | TechnologyDetection)[]) => 
    techs.map(tech => typeof tech === 'string' ? tech : tech.name).filter(Boolean);

// Enhanced function to group technologies by confidence and source for concise embedding
const createGroupedTechStrings = (techs: (string | TechnologyDetection)[]) => {
  const groups: Record<string, string[]> = {
    'high confidence usage, from active development': [],
    'high confidence usage, from codebase analysis': [],
    'high confidence usage, from project metadata': [],
    'strong evidence of usage, from active development': [],
    'strong evidence of usage, from codebase analysis': [],
    'strong evidence of usage, from project metadata': [],
    'evidence of usage, from active development': [],
    'evidence of usage, from codebase analysis': [],
    'evidence of usage, from project metadata': [],
    'potential usage, from project metadata': []
  };

  techs.forEach(tech => {
    if (typeof tech === 'string') {
      groups['evidence of usage, from project metadata'].push(tech);
      return;
    }
    
    if (tech && tech.name && tech.confidence) {
      const confidenceLevel = tech.confidence >= 0.8 ? 'high confidence usage' : 
                              tech.confidence >= 0.6 ? 'strong evidence of usage' : 
                              tech.confidence >= 0.4 ? 'evidence of usage' : 'potential usage';
      const source = tech.source === 'commit' ? 'active development' :
                    tech.source === 'file' ? 'codebase analysis' : 'project metadata';
      
      const key = `${confidenceLevel}, from ${source}`;
      if (groups[key]) {
        groups[key].push(tech.name);
      }
    }
  });

  // Return formatted groups, filtering out empty ones
  return Object.entries(groups)
    .filter(([, techs]) => techs.length > 0)
    .map(([groupKey, techs]) => `${groupKey}: ${techs.join(', ')}`);
};

function createEmbeddingText(data: GitHubProfileAnalysis): string {
  const { username, totalRepositories, overallTechnologies, analyzedRepositories, contributionSummary } = data;
  
  // Helper function to add tech category only if it has content
  const addTechCategory = (label: string, techArray: (string | TechnologyDetection)[]) => {
    const techGroups = createGroupedTechStrings(techArray);
    if (techGroups.length > 0) {
      return `${label}: ${techGroups.join('; ')}`;
    }
    return null;
  };
  
  const embeddingParts = [
    `GitHub Profile: ${username}`,
    `Total Repositories: ${totalRepositories}`,
    addTechCategory('Programming Languages', overallTechnologies.languages || []),
    addTechCategory('Web Frameworks', overallTechnologies.webFrameworks || []),
    addTechCategory('Libraries', overallTechnologies.libraries || []),
    addTechCategory('Databases', overallTechnologies.databases || []),
    addTechCategory('Data Processing', overallTechnologies.dataProcessing || []),
    addTechCategory('ORM', overallTechnologies.orm || []),
    addTechCategory('Containerization', overallTechnologies.containerization || []),
    addTechCategory('Orchestration', overallTechnologies.orchestration || []),
    addTechCategory('Cloud Platforms', overallTechnologies.cloudPlatforms || []),
    addTechCategory('Infrastructure', overallTechnologies.infrastructure || []),
    addTechCategory('Distributed Systems', overallTechnologies.distributedSystems || []),
    addTechCategory('Messaging Queues', overallTechnologies.messagingQueues || []),
    addTechCategory('Consensus', overallTechnologies.consensus || []),
    addTechCategory('CI/CD', overallTechnologies.cicd || []),
    addTechCategory('Monitoring', overallTechnologies.monitoring || []),
    addTechCategory('Deployment', overallTechnologies.deployment || []),
    addTechCategory('Architectural Patterns', overallTechnologies.architecturalPatterns || []),
    addTechCategory('Design Patterns', overallTechnologies.designPatterns || []),
    addTechCategory('Security', overallTechnologies.security || []),
  ];

  if (analyzedRepositories && analyzedRepositories.length > 0) {
    embeddingParts.push('Recent Projects:');
    analyzedRepositories.slice(0, 5).forEach(repo => {
      // Combine all technologies from the repository
      const allRepoTechs = [
        ...(repo.technologies.languages || []),
        ...(repo.technologies.webFrameworks || []),
        ...(repo.technologies.libraries || []),
        ...(repo.technologies.databases || []),
        ...(repo.technologies.cloudPlatforms || []),
        ...(repo.technologies.architecturalPatterns || [])
      ];
      
      const repoTechGroups = createGroupedTechStrings(allRepoTechs);
      
      const repoInfo = [
        `${repo.name}${repo.description ? `: ${repo.description}` : ''}`,
        repoTechGroups.length > 0 ? `Technologies: ${repoTechGroups.join('; ')}` : null
      ].filter(Boolean).join(' | ');
      
      if (repoInfo.trim()) {
        embeddingParts.push(repoInfo);
      }
    });
  }

  // Skip recent activity since we removed lastUpdated field
  // Focus on technology expertise instead

  // Skip star count since we removed stars field
  if (analyzedRepositories.length > 0) {
    embeddingParts.push(`Total Active Projects: ${analyzedRepositories.length}`);
  }

  // Add contribution activity information
  if (contributionSummary && (contributionSummary.totalActivities > 0 || contributionSummary.openSourceContributions > 0)) {
    embeddingParts.push(`Open Source Activity:`);
    embeddingParts.push(`Total Recent Activities: ${contributionSummary.totalActivities}`);
    embeddingParts.push(`Open Source Contributions: ${contributionSummary.openSourceContributions}`);
    
    if (contributionSummary.openSourceContributions > 0) {
      const activityTypes = Object.entries(contributionSummary.contributionsByType || {})
        .filter(([, count]) => count > 0)
        .map(([type, count]) => `${count} ${type.replace('_', ' ')}${count > 1 ? 's' : ''}`)
        .join(', ');
      
      if (activityTypes) {
        embeddingParts.push(`Activity Types: ${activityTypes}`);
      }

      // Include notable open source repositories they've contributed to
      const openSourceRepos = (contributionSummary.activeRepositories || [])
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
    } else {
      // Fallback to regular authenticated client
      supabase = createRouteHandlerClient({ cookies });
    }

    const embeddingText = createEmbeddingText(data);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const result = await model.embedContent(embeddingText);
    const embedding = result.embedding.values.slice(0, 1536);

    const metadata = {
      username: data.username,
      totalRepositories: data.totalRepositories,
      languages: extractTechNames(data.overallTechnologies?.languages || []),
      webFrameworks: extractTechNames(data.overallTechnologies?.webFrameworks || []),
      libraries: extractTechNames(data.overallTechnologies?.libraries || []),
      databases: extractTechNames(data.overallTechnologies?.databases || []),
      cloudPlatforms: extractTechNames(data.overallTechnologies?.cloudPlatforms || []),
      containerization: extractTechNames(data.overallTechnologies?.containerization || []),
      distributedSystems: extractTechNames(data.overallTechnologies?.distributedSystems || []),
      architecturalPatterns: extractTechNames(data.overallTechnologies?.architecturalPatterns || []),
      totalActiveProjects: data.analyzedRepositories?.length || 0,
      analysisDate: data.analysisDate,
      openSourceContributions: data.contributionSummary?.openSourceContributions || 0,
      totalActivities: data.contributionSummary?.totalActivities || 0,
      contributionTypes: data.contributionSummary?.contributionsByType || {},
      activeRepositories: data.contributionSummary?.activeRepositories || []
    };

    // Save to Supabase
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        github_vector_embeddings: embedding,
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

    const queryVector = embedding; 

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