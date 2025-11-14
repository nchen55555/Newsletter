/**
 * JavaScript/TypeScript implementation of candidate similarity matching
 * Replaces the Python candidate_matcher.py for Vercel compatibility
 */

import { SkillScores } from '../types/candidate-matching';

interface CandidateData {
  candidate_id: string;
  skills: SkillScores;
  github_vector_embeddings?: number[];
}

interface SimilarityMatch {
  candidate_id: string;
  similarity: number;
  distance: number;
  skills: SkillScores;
}

export class CandidateSimilarityCalculator {
  private candidates: CandidateData[] = [];
  
  // Skill dimensions for normalization
  private skillDims = ['systems_infrastructure', 'theory_statistics_ml', 'product', 'github_similarity'] as const;
  private normalizedDims = ['systems_infrastructure', 'theory_statistics_ml', 'product'] as const;
  
  constructor(candidates: CandidateData[] = []) {
    this.candidates = candidates;
  }

  /**
   * Calculate Euclidean distance between two skill vectors
   */
  private euclideanDistance(skills1: SkillScores, skills2: SkillScores, weights?: Partial<SkillScores>): number {
    let sumSquaredDiff = 0;
    let totalWeight = 0;

    for (const dim of this.skillDims) {
      const val1 = skills1[dim] || 0;
      const val2 = skills2[dim] || 0;
      const weight = weights?.[dim] || 1.0;
      
      sumSquaredDiff += weight * Math.pow(val1 - val2, 2);
      totalWeight += weight;
    }

    return Math.sqrt(sumSquaredDiff / totalWeight);
  }

  /**
   * Calculate cosine similarity between two skill vectors
   */
  private cosineSimilarity(skills1: SkillScores, skills2: SkillScores): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const dim of this.skillDims) {
      const val1 = skills1[dim] || 0;
      const val2 = skills2[dim] || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Normalize skills based on the dataset statistics
   */
  private normalizeSkills(skills: SkillScores): SkillScores {
    const normalized = { ...skills };
    
    if (this.candidates.length === 0) {
      return normalized;
    }

    // Calculate mean and std for normalized dimensions
    for (const dim of this.normalizedDims) {
      const values = this.candidates.map(c => c.skills[dim] || 0);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      
      if (std > 0) {
        normalized[dim] = (normalized[dim] - mean) / std;
      }
    }

    // Keep github_similarity as is (already 0-1)
    return normalized;
  }

  /**
   * Find similar candidates based on skill similarity
   */
  findSimilar(
    querySkills: SkillScores, 
    topK: number = 5, 
    weights?: Partial<SkillScores>,
    excludeIds?: string[]
  ): SimilarityMatch[] {
    if (this.candidates.length === 0) {
      return [];
    }

    const normalizedQuery = this.normalizeSkills(querySkills);
    const matches: SimilarityMatch[] = [];

    for (const candidate of this.candidates) {
      // Skip excluded candidates
      if (excludeIds?.includes(candidate.candidate_id)) {
        continue;
      }

      const normalizedCandidate = this.normalizeSkills(candidate.skills);
      const distance = this.euclideanDistance(normalizedQuery, normalizedCandidate, weights);
      const similarity = this.cosineSimilarity(normalizedQuery, normalizedCandidate);

      matches.push({
        candidate_id: candidate.candidate_id,
        similarity,
        distance,
        skills: candidate.skills
      });
    }

    // Sort by similarity (descending) and distance (ascending)
    matches.sort((a, b) => {
      if (Math.abs(a.similarity - b.similarity) > 0.01) {
        return b.similarity - a.similarity;
      }
      return a.distance - b.distance;
    });

    return matches.slice(0, topK);
  }

  /**
   * Add a new candidate to the dataset
   */
  addCandidate(candidateId: string, skills: SkillScores, githubEmbeddings?: number[]): void {
    this.candidates.push({
      candidate_id: candidateId,
      skills,
      github_vector_embeddings: githubEmbeddings
    });
  }

  /**
   * Get dataset size
   */
  getDatasetSize(): number {
    return this.candidates.length;
  }
}