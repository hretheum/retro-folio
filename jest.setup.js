// Jest setup for test environment
const { config } = require('dotenv');

// Load test environment variables
config({ path: '.env.test' });

// Mock APIs for testing
global.fetch = jest.fn();

// Mock performance API for Node.js environment
if (typeof performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  };
}

// Mock TextEncoder/TextDecoder for tests
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}

// Console overrides for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Suppress specific test warnings
  const message = args[0];
  if (typeof message === 'string') {
    if (message.includes('PineconeConfigurationError') ||
        message.includes('OPENAI_API_KEY') ||
        message.includes('jest-haste-map')) {
      return;
    }
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  // Suppress specific test warnings
  const message = args[0];
  if (typeof message === 'string') {
    if (message.includes('deprecated') ||
        message.includes('version incompatibility')) {
      return;
    }
  }
  originalConsoleWarn.apply(console, args);
};

// Mock external dependencies that might fail in test environment
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      namespace: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue({ matches: [] }),
        upsert: jest.fn().mockResolvedValue({}),
        fetch: jest.fn().mockResolvedValue({ records: [] })
      }),
      query: jest.fn().mockResolvedValue({ matches: [] }),
      upsert: jest.fn().mockResolvedValue({}),
      describe: jest.fn().mockResolvedValue({ dimension: 1536 })
    })
  }))
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
          usage: { total_tokens: 100 }
        })
      }
    }
  }))
}));

// Mock semantic search with proper structure
jest.mock('./lib/semantic-search', () => ({
  semanticSearchPinecone: jest.fn().mockResolvedValue([
    {
      chunk: {
        id: 'test-chunk-1',
        text: 'Test content for semantic search',
        metadata: {
          contentType: 'work',
          contentId: 'test-content-1',
          source: 'test'
        }
      },
      score: 0.8,
      confidence: 0.85
    }
  ])
}));

// Mock vector search components
jest.mock('./lib/pinecone-client', () => ({
  searchSimilar: jest.fn().mockResolvedValue([
    {
      chunk: {
        id: 'test-chunk-1',
        text: 'Test content for search',
        metadata: {
          contentType: 'work',
          contentId: 'test-content-1'
        }
      },
      score: 0.8
    }
  ])
}));

// Set test environment
process.env.NODE_ENV = 'test';