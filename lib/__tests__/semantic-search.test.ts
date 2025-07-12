import { cosineSimilarity, buildContextWindow, semanticSearch } from '../semantic-search';
import type { SearchResult } from '../vector-store';
import type { EmbeddedChunk } from '../embedding-generator';

describe('Semantic Search', () => {
  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      // Identical vectors
      expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBe(1);
      
      // Orthogonal vectors
      expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0);
      
      // Opposite vectors
      expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBe(-1);
      
      // Similar vectors
      const sim = cosineSimilarity([1, 2, 3], [2, 4, 6]);
      expect(sim).toBeCloseTo(1, 5);
    });
    
    it('should handle zero vectors', () => {
      expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
      expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
    });
    
    it('should throw error for different length vectors', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });
  
  describe('buildContextWindow', () => {
    const createMockChunk = (
      id: string,
      type: string,
      text: string
    ): EmbeddedChunk => ({
      id,
      text,
      metadata: {
        contentId: id,
        contentType: type as any,
        chunkIndex: 0,
        totalChunks: 1,
      },
      tokens: Math.ceil(text.length / 4),
      embedding: [],
    });
    
    const createMockResult = (
      chunk: EmbeddedChunk,
      score: number
    ): SearchResult => ({
      chunk,
      score,
    });
    
    it('should build context with type headers', () => {
      const results: SearchResult[] = [
        createMockResult(
          createMockChunk('exp1', 'experiment', 'AI experiment text'),
          0.95
        ),
        createMockResult(
          createMockChunk('work1', 'work', 'Work experience text'),
          0.85
        ),
      ];
      
      const context = buildContextWindow(results);
      
      expect(context).toContain('### EXPERIMENT');
      expect(context).toContain('### WORK');
      expect(context).toContain('AI experiment text');
      expect(context).toContain('Work experience text');
      expect(context).toContain('95.0%');
      expect(context).toContain('85.0%');
    });
    
    it('should respect token limit', () => {
      const longText = 'Very long text '.repeat(50);
      const results: SearchResult[] = [
        createMockResult(
          createMockChunk('1', 'experiment', longText),
          0.9
        ),
        createMockResult(
          createMockChunk('2', 'work', longText),
          0.8
        ),
      ];
      
      const context = buildContextWindow(results, 100);
      const estimatedTokens = Math.ceil(context.length / 4);
      
      expect(estimatedTokens).toBeLessThanOrEqual(100);
    });
    
    it('should handle empty results', () => {
      expect(buildContextWindow([])).toBe('');
    });
    
    it('should group results by type', () => {
      const results: SearchResult[] = [
        createMockResult(
          createMockChunk('exp1', 'experiment', 'Exp 1'),
          0.9
        ),
        createMockResult(
          createMockChunk('exp2', 'experiment', 'Exp 2'),
          0.85
        ),
        createMockResult(
          createMockChunk('work1', 'work', 'Work 1'),
          0.8
        ),
      ];
      
      const context = buildContextWindow(results);
      const lines = context.split('\n');
      
      // Check that experiments are grouped together
      const expHeaderIndex = lines.findIndex(l => l.includes('EXPERIMENT'));
      const workHeaderIndex = lines.findIndex(l => l.includes('WORK'));
      const exp1Index = lines.findIndex(l => l.includes('Exp 1'));
      const exp2Index = lines.findIndex(l => l.includes('Exp 2'));
      
      expect(expHeaderIndex).toBeLessThan(exp1Index);
      expect(expHeaderIndex).toBeLessThan(exp2Index);
      expect(exp2Index).toBeLessThan(workHeaderIndex);
    });
  });
});