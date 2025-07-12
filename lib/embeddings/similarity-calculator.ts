export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

export interface SimilarityResult {
  id: string;
  score: number;
  metadata?: any;
}

export async function findMostSimilar(
  queryVector: number[],
  candidates: Array<{ id: string; vector: number[]; metadata?: any }>,
  options: { topK?: number; minScore?: number } = {}
): Promise<SimilarityResult[]> {
  const { topK = 5, minScore = 0 } = options;
  
  // Calculate similarities
  const similarities = candidates.map(candidate => ({
    id: candidate.id,
    score: calculateCosineSimilarity(queryVector, candidate.vector),
    metadata: candidate.metadata
  }));
  
  // Filter by minimum score
  const filtered = similarities.filter(s => s.score >= minScore);
  
  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);
  
  // Return top K
  return filtered.slice(0, topK);
}

// Dynamic threshold based on score distribution
export function calculateDynamicThreshold(scores: number[]): number {
  if (scores.length === 0) return 0.7;
  
  const sorted = [...scores].sort((a, b) => b - a);
  const maxScore = sorted[0];
  const secondScore = sorted[1] || 0;
  
  // If top score is significantly higher, use adaptive threshold
  if (maxScore - secondScore > 0.2) {
    return secondScore + (maxScore - secondScore) * 0.5;
  }
  
  // Otherwise use fixed threshold
  return Math.min(0.7, maxScore * 0.8);
}