interface SkillScores {
  systems_infrastructure: number;
  theory_statistics_ml: number;
  product: number;
  github_similarity?: number;
}

interface EmployeeProfile extends SkillScores {
  id?: string;
  github_vector_embeddings?: number[];
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (!vectorA || !vectorB || vectorA.length === 0 || vectorB.length === 0) {
    return 0;
  }
  
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must be the same length for cosine similarity');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  
  if (magnitude === 0) {
    return 0;
  }
  
  return dotProduct / magnitude;
}

/**
 * Calculate cluster-based compatibility between candidate and company reference profiles
 * Uses cluster statistics from good-fit employees instead of arbitrary skill requirements
 * 
 * Algorithm:
 * 1. Determine available dimensions based ONLY on company reference profiles (ensures consistency)
 * 2. Calculate direct GitHub similarities between candidate and each company employee (if GitHub data available)
 * 3. Calculate cluster center and variance from reference profiles (using direct similarities for GitHub)
 * 4. Derive importance weights from inverse variance (consistent skills = more important)
 * 5. Score candidate against weighted cluster center with tolerance based on cluster spread
 * 
 * @param candidateSkills Candidate's skill scores
 * @param referenceProfiles Array of employee profiles from good-fit employees (determines available dimensions)
 * @param candidateGithubVector Candidate's GitHub embedding vector (required if company has GitHub data)
 * @param userWeights Optional: user-specified category weights
 * @returns Compatibility object with cluster-based scoring
 */
export function calculateCandidateCompanyCompatibility(
  candidateSkills: SkillScores,
  referenceProfiles: EmployeeProfile[],
  candidateGithubVector?: number[],
  userWeights?: { systems_infrastructure: number; theory_statistics_ml: number; product: number; github_similarity?: number }
) {
  // Determine which dimensions have actual data based ONLY on company reference profiles
  // This ensures consistent dimension availability for all candidates comparing against the same company
  const hasAcademicData = referenceProfiles.some(profile => 
    (profile.systems_infrastructure || 0) > 0 || 
    (profile.theory_statistics_ml || 0) > 0 || 
    (profile.product || 0) > 0
  );

  const candidateHasAcademicData = (candidateSkills.systems_infrastructure || 0) > 0 || 
    (candidateSkills.theory_statistics_ml || 0) > 0 || 
    (candidateSkills.product || 0) > 0
  
  const hasGithubData = referenceProfiles.some(profile => 
    profile.github_vector_embeddings && profile.github_vector_embeddings.length > 0
  ) && candidateGithubVector && candidateGithubVector.length > 0;

  const candidateHasGithubData = (candidateGithubVector != null)

  
  // Only include dimensions that have actual data
  const availableAcademicDims = hasAcademicData ? ['systems_infrastructure', 'theory_statistics_ml', 'product'] as const : [] as const;
  
  const academicDims = availableAcademicDims;
  
  if (!referenceProfiles || referenceProfiles.length === 0) {
    throw new Error('No reference profiles provided for cluster analysis');
  }
  
  if (!hasAcademicData && !hasGithubData) {
    throw new Error('Company reference profiles have no skill data available for similarity calculation');
  }
  
  if (referenceProfiles.length < 2) {
    throw new Error('Need at least 2 reference profiles to calculate meaningful company similarity');
  }

  // Calculate cluster center (mean) - only for available dimensions
  const center: SkillScores = {
    systems_infrastructure: 0,
    theory_statistics_ml: 0,
    product: 0
  };
  
  // Handle academic skills only if we have academic data
  if (hasAcademicData && candidateHasAcademicData) {
    for (const skill of academicDims) {
      const sum = referenceProfiles.reduce((acc, profile) => acc + (profile[skill] || 0), 0);
      center[skill] = sum / referenceProfiles.length;
    }
  }
  
  // Handle GitHub similarity only if we have GitHub data
  let candidateGithubScore = 0;
  if (hasGithubData && candidateHasGithubData) {
    const githubProfiles = referenceProfiles.filter(profile => 
      profile.github_vector_embeddings && profile.github_vector_embeddings.length > 0
    );
    
    if (githubProfiles.length > 0) {
      // Calculate direct similarities between candidate and each company employee
      const directSimilarities = githubProfiles.map(profile => 
        calculateCosineSimilarity(candidateGithubVector, profile.github_vector_embeddings!)
      );
      
      // Simple average - represents how well candidate fits with company's GitHub profile
      const averageSimilarity = directSimilarities.reduce((acc, similarity) => acc + similarity, 0) / directSimilarities.length;
      
      // Scale to 0-100 to match academic dimensions
      candidateGithubScore = averageSimilarity * 100;
      
      // For cluster center, we don't need this for GitHub anymore since we're not doing clustering
      center.github_similarity = candidateGithubScore;
    }
  }

  // Calculate standard deviations
  const std_dev: SkillScores = {
    systems_infrastructure: 0,
    theory_statistics_ml: 0,
    product: 0
  };

  // Handle academic skills only if we have academic data
  if (hasAcademicData && candidateHasAcademicData) {
    for (const skill of academicDims) {
      const variance = referenceProfiles.reduce((acc, profile) => {
        return acc + Math.pow((profile[skill] || 0) - (center[skill] || 0), 2);
      }, 0) / (referenceProfiles.length - 1);
      std_dev[skill] = Math.sqrt(variance);
    }
  }
  
  // GitHub uses direct scoring, not clustering, so no standard deviation needed

  // Calculate importance weights using inverse variance
  const clusterWeights: SkillScores = {
    systems_infrastructure: 0,
    theory_statistics_ml: 0,
    product: 0
  };

  // Handle academic skills only if we have academic data
  if (hasAcademicData && candidateHasAcademicData) {
    for (const skill of academicDims) {
      clusterWeights[skill] = 1 / (1 + (std_dev[skill] || 1));
    }
  }
  
  // GitHub uses user-defined weights only, not cluster-based weights

  // Normalize academic weights only (GitHub handled separately)
  if (hasAcademicData && candidateHasAcademicData) {
    const totalAcademicWeight = clusterWeights.systems_infrastructure + clusterWeights.theory_statistics_ml + clusterWeights.product;
    const normalizationFactor = 3 / totalAcademicWeight; // Average of 1.0 across 3 academic dimensions
    
    for (const skill of academicDims) {
      clusterWeights[skill] *= normalizationFactor;
    }
  }

  // Use user weights if provided, otherwise use cluster weights for academic + default for GitHub
  const finalWeights: SkillScores = {
    systems_infrastructure: 0,
    theory_statistics_ml: 0,
    product: 0
  };
  
  // Academic dimensions: use user weights or cluster weights
  if (hasAcademicData && candidateHasAcademicData) {
    if (userWeights) {
      finalWeights.systems_infrastructure = userWeights.systems_infrastructure;
      finalWeights.theory_statistics_ml = userWeights.theory_statistics_ml;
      finalWeights.product = userWeights.product;
    } else {
      finalWeights.systems_infrastructure = clusterWeights.systems_infrastructure;
      finalWeights.theory_statistics_ml = clusterWeights.theory_statistics_ml;
      finalWeights.product = clusterWeights.product;
    }
  }
  
  // GitHub dimension: use user weight or default to 1.0
  if (hasGithubData && candidateHasGithubData) {
    finalWeights.github_similarity = userWeights?.github_similarity ?? 1.0;
  }

  // Calculate weighted compatibility score using normalized weights
  const skillScores: Record<string, number> = {};
  
  // First, calculate individual skill scores for academic skills
  for (const skill of academicDims) {
    const centerValue = center[skill] || 0;
    const tolerance = Math.max(5, std_dev[skill] || 1); // Minimum tolerance of 5
    
    // Asymmetric scoring: reward above average, penalize below average
    const candidateValue = candidateSkills[skill] || 0;
    const difference = candidateValue - centerValue; // No Math.abs - keep the sign!
    const normalizedDifference = difference / tolerance;
    
    let skillScore;
    if (difference >= 0) {
      // Above average: bonus using exponential growth (capped at reasonable max)
      skillScore = Math.min(120, 100 + (20 * (1 - Math.exp(-normalizedDifference * 0.8))));
    } else {
      // Below average: penalty using exponential decay
      skillScore = Math.max(40, 100 * Math.exp(normalizedDifference * 0.8)); // Note: normalizedDifference is negative
    }
    
    skillScores[skill] = skillScore;
  }
  
  // Handle GitHub similarity - use direct score (already 0-100)
  if (hasGithubData && candidateHasGithubData) {
    // Use the direct score we calculated (average similarity * 100)
    skillScores.github_similarity = candidateGithubScore;
  }
  
  // Then calculate weighted average using normalized weights (always sum to 1)
  const totalFinalWeight = (finalWeights.systems_infrastructure || 0) + 
    (finalWeights.theory_statistics_ml || 0) + 
    (finalWeights.product || 0) + 
    (hasGithubData ? (finalWeights.github_similarity || 0) : 0);
  
  const normalizedWeights = {
    systems_infrastructure: (finalWeights.systems_infrastructure || 0) / totalFinalWeight,
    theory_statistics_ml: (finalWeights.theory_statistics_ml || 0) / totalFinalWeight,
    product: (finalWeights.product || 0) / totalFinalWeight,
    ...((hasGithubData && candidateHasGithubData) && { github_similarity: (finalWeights.github_similarity || 0) / totalFinalWeight })
  };
  
  let similarityPercentage = 
    (skillScores.systems_infrastructure || 0) * normalizedWeights.systems_infrastructure +
    (skillScores.theory_statistics_ml || 0) * normalizedWeights.theory_statistics_ml +
    (skillScores.product || 0) * normalizedWeights.product;
    
  if (hasGithubData && skillScores.github_similarity !== undefined) {
    similarityPercentage += skillScores.github_similarity * (normalizedWeights.github_similarity || 0);
  }
  
  const similarity = similarityPercentage / 100;

  // Calculate skill differences for display (candidate - cluster center)
  const skillDifferences = {
    systems_infrastructure: (candidateSkills.systems_infrastructure || 0) - (center.systems_infrastructure || 0),
    theory_statistics_ml: (candidateSkills.theory_statistics_ml || 0) - (center.theory_statistics_ml || 0),
    product: (candidateSkills.product || 0) - (center.product || 0),
    ...((hasGithubData && candidateHasGithubData) && {
      // GitHub shows raw similarity score (0-100) since it's already meaningful
      github_similarity: candidateGithubScore
    })
  };

  // Create the final skills object with calculated scores
  const finalSkills = {
    systems_infrastructure: candidateSkills.systems_infrastructure,
    theory_statistics_ml: candidateSkills.theory_statistics_ml,
    product: candidateSkills.product,
    ...((hasGithubData && candidateHasGithubData) && { github_similarity: candidateGithubScore }) // Use calculated GitHub score
  };

  return {
    distance: (100 - similarityPercentage) / 100, // Convert back to distance-like metric
    similarity,
    similarity_percentage: similarityPercentage,
    skills: finalSkills, // Use final skills with calculated GitHub score
    company_requirements: center, // Use cluster center as "requirements"
    skill_differences: skillDifferences,
    cluster_stats: {
      center,
      std_dev,
      cluster_weights: clusterWeights,
      final_weights: finalWeights,
      sample_size: referenceProfiles.length
    }
  };
}
