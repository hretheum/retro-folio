// Mock OpenAI module
jest.mock('../openai', () => ({
  estimateTokens: jest.fn((text: string) => Math.ceil(text.length / 4)),
  openai: {
    apiKey: 'test-key'
  }
}));

import { chunkText, chunkContent } from '../text-chunker';
import { estimateTokens } from '../openai';
import type { ExtractedContent } from '../content-extractor';

describe('Text Chunker', () => {
  describe('chunkText', () => {
    it('should return single chunk for short text', () => {
      const text = 'This is a short text.';
      const chunks = chunkText(text);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe(text);
      expect(chunks[0].tokens).toBeLessThanOrEqual(512);
    });
    
    it('should split long text into multiple chunks', () => {
      const longText = 'This is a sentence. '.repeat(100);
      const chunks = chunkText(longText, { maxTokens: 100 });
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.tokens).toBeLessThanOrEqual(100);
      });
    });
    
    it('should maintain overlap between chunks', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';
      const chunks = chunkText(text, { maxTokens: 20, overlap: 10 });
      
      if (chunks.length > 1) {
        // Check that there's some overlap (chunks share some text)
        for (let i = 0; i < chunks.length - 1; i++) {
          const currentEnd = chunks[i].text.split(' ').slice(-3).join(' ');
          const nextStart = chunks[i + 1].text.split(' ').slice(0, 3).join(' ');
          
          // There should be some similarity between end of current and start of next
          expect(chunks[i + 1].text).toContain(
            chunks[i].text.split('. ').slice(-1)[0].split(' ').slice(-2).join(' ')
          );
        }
      }
    });
    
    it('should preserve sentence boundaries', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = chunkText(text, { preserveSentences: true, maxTokens: 15 });
      
      chunks.forEach(chunk => {
        // Each chunk should end with punctuation or be the last chunk
        expect(
          chunk.text.endsWith('.') || 
          chunk.text.endsWith('!') || 
          chunk.text.endsWith('?') ||
          chunk === chunks[chunks.length - 1]
        ).toBe(true);
      });
    });
    
    it('should handle empty text', () => {
      expect(chunkText('')).toEqual([]);
      expect(chunkText('   ')).toEqual([]);
    });
  });
  
  describe('chunkContent', () => {
    const mockContent: ExtractedContent = {
      id: 'test-1',
      type: 'experiment',
      title: 'Test Experiment',
      content: 'This is a test experiment with multiple sentences. It has various learnings. Each learning is important.',
      metadata: {
        tags: ['test', 'ai'],
        featured: true,
      },
    };
    
    it('should create chunks with proper metadata', () => {
      const chunks = chunkContent(mockContent);
      
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk, index) => {
        expect(chunk.id).toBe(`test-1-chunk-${index}`);
        expect(chunk.metadata.contentId).toBe('test-1');
        expect(chunk.metadata.contentType).toBe('experiment');
        expect(chunk.metadata.chunkIndex).toBe(index);
        expect(chunk.metadata.totalChunks).toBe(chunks.length);
        expect(chunk.metadata.tags).toEqual(['test', 'ai']);
        expect(chunk.metadata.featured).toBe(true);
      });
    });
    
    it('should respect chunking options', () => {
      const chunks = chunkContent(mockContent, { maxTokens: 15 });
      
      chunks.forEach(chunk => {
        expect(chunk.tokens).toBeLessThanOrEqual(15);
      });
    });
  });
  
  describe('edge cases', () => {
    it('should handle very long single words', () => {
      const longWord = 'a'.repeat(5000);
      const chunks = chunkText(longWord, { maxTokens: 100 });
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.tokens).toBeLessThanOrEqual(100);
      });
    });
    
    it('should handle text with no sentence boundaries', () => {
      const text = 'This is text without punctuation that goes on and on';
      const chunks = chunkText(text, { maxTokens: 10, preserveSentences: true });
      
      expect(chunks.length).toBeGreaterThan(0);
    });
    
    it('should handle special characters', () => {
      const text = 'Code: `const x = 1;` More text... And more!!! Really???';
      const chunks = chunkText(text);
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain('Code:');
    });
  });
});