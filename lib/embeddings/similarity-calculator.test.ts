import { 
  calculateCosineSimilarity, 
  findMostSimilar, 
  calculateDynamicThreshold 
} from './similarity-calculator';

describe('SimilarityCalculator', () => {
  test('calculateCosineSimilarity with identical vectors', () => {
    const vector = [1, 0, 0, 1];
    const similarity = calculateCosineSimilarity(vector, vector);
    expect(similarity).toBeCloseTo(1.0);
  });
  
  test('calculateCosineSimilarity with orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    const similarity = calculateCosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(0.0);
  });
  
  test('calculateCosineSimilarity with opposite vectors', () => {
    const a = [1, 0];
    const b = [-1, 0];
    const similarity = calculateCosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(-1.0);
  });
  
  test('findMostSimilar returns top K results', async () => {
    const query = [1, 0, 0];
    const candidates = [
      { id: '1', vector: [1, 0, 0] },      // similarity = 1.0
      { id: '2', vector: [0.8, 0.6, 0] },  // similarity ≈ 0.8
      { id: '3', vector: [0, 1, 0] },      // similarity = 0.0
      { id: '4', vector: [0.6, 0.8, 0] },  // similarity ≈ 0.6
    ];
    
    const results = await findMostSimilar(query, candidates, { topK: 2 });
    
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1');
    expect(results[0].score).toBeCloseTo(1.0);
    expect(results[1].id).toBe('2');
  });
  
  test('calculateDynamicThreshold with clear winner', () => {
    const scores = [0.95, 0.65, 0.60, 0.55];
    const threshold = calculateDynamicThreshold(scores);
    
    // Should be between second score and top score
    expect(threshold).toBeGreaterThan(0.65);
    expect(threshold).toBeLessThan(0.95);
  });
  
  test('calculateDynamicThreshold with close scores', () => {
    const scores = [0.85, 0.83, 0.82, 0.80];
    const threshold = calculateDynamicThreshold(scores);
    
    // Should use percentage of max
    expect(threshold).toBeCloseTo(0.85 * 0.8, 1);
  });
});