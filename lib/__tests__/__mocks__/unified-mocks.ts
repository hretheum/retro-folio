// Unified mocks for chat intelligence tests
export const mockEmbeddedChunk = {
  id: 'test-chunk-1',
  vector: new Array(1536).fill(0.1),
  chunk: {
    id: 'chunk-1',
    text: 'Test content for embedded chunk',
    order: 1,
    metadata: {
      contentId: 'test-content-1',
      contentType: 'work' as const,
      chunkIndex: 0,
      totalChunks: 1,
      date: '2023-01-01',
      tags: ['test', 'mock'],
      technologies: ['typescript', 'jest'],
      featured: false,
      url: 'https://test.com',
      role: 'test-role'
    }
  }
};

export const mockSearchResults = [
  {
    id: 'result-1',
    score: 0.95,
    chunk: {
      text: 'Test search result content',
      metadata: {
        contentId: 'test-search-1',
        contentType: 'work' as const,
        chunkIndex: 0,
        totalChunks: 1,
        date: '2023-01-01',
        tags: ['search', 'test'],
        technologies: ['react', 'typescript'],
        featured: true,
        url: 'https://example.com',
        role: 'developer'
      }
    }
  }
];

export const mockHybridSearchPinecone = jest.fn().mockResolvedValue(mockSearchResults);

export const mockOpenAIResponse = {
  choices: [{
    message: {
      content: 'This is a test AI response'
    }
  }]
};

export const mockGenerateEmbedding = jest.fn().mockResolvedValue(new Array(1536).fill(0.1));

// Dummy test to prevent "must contain at least one test" error
describe('Unified Mocks', () => {
  it('should export mock functions and data', () => {
    expect(mockEmbeddedChunk).toBeDefined();
    expect(mockSearchResults).toBeDefined();
    expect(mockHybridSearchPinecone).toBeDefined();
    expect(mockOpenAIResponse).toBeDefined();
    expect(mockGenerateEmbedding).toBeDefined();
  });
});