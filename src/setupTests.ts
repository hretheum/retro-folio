// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Node.js polyfills for browser environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Fetch polyfill
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Mock dla Pinecone
jest.mock('@pinecone-database/pinecone', () => {
  const mockIndex = {
    namespace: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({
        matches: [
          {
            id: 'test-1',
            score: 0.95,
            metadata: {
              text: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
              contentType: 'work',
              technologies: ['typescript', 'javascript'],
              date: '2023-01-01'
            }
          },
          {
            id: 'test-2',
            score: 0.85,
            metadata: {
              text: 'Best practices include using strict mode, proper typing, and following coding conventions.',
              contentType: 'experiment',
              technologies: ['typescript'],
              date: '2023-06-01'
            }
          },
          {
            id: 'test-3',
            score: 0.75,
            metadata: {
              text: 'OAuth2 authentication can be implemented using libraries like passport.js or custom middleware.',
              contentType: 'work',
              technologies: ['oauth2', 'authentication', 'typescript'],
              date: '2023-03-15'
            }
          }
        ]
      }),
      upsert: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
      deleteAll: jest.fn().mockResolvedValue({})
    })
  };

  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnValue(mockIndex)
    }))
  };
});

// Mock dla innych zewnętrznych zależności  
jest.mock('vectra', () => {
  return {
    LocalIndex: jest.fn().mockImplementation(() => ({
      isIndexCreated: jest.fn().mockResolvedValue(true),
      createIndex: jest.fn().mockResolvedValue(undefined),
      beginUpdate: jest.fn().mockReturnValue({
        insert: jest.fn(),
        upsert: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      }),
      queryItems: jest.fn().mockResolvedValue([
        {
          item: {
            metadata: {
              chunk: {
                text: 'Local vector search result for TypeScript best practices',
                metadata: { contentType: 'work', technologies: ['typescript'] }
              }
            }
          },
          score: 0.9
        }
      ])
    }))
  };
});

jest.mock('redis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn()
  };
  
  return {
    createClient: jest.fn().mockReturnValue(mockRedis)
  };
});

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Mocked response'
              }
            }]
          })
        }
      }
    }))
  };
});

// Extend expect with jest-dom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value: string | string[] | number): R;
      toHaveClass(...classNames: string[]): R;
    }
  }
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock as any;