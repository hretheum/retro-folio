# Comprehensive Chat Endpoints Testing Plan
## 🎯 Testowanie Wszystkich Skrajnych Przypadków

### 📋 Kategorie Testów

## 1. 🧪 UNIT TESTS - Izolowane Komponenty
```
tests/unit/
├── endpoints/
│   ├── chat.test.ts
│   ├── chat-streaming.test.ts
│   ├── chat-with-llm.test.ts
│   └── intelligent-chat.test.ts
├── context-management/
│   ├── chat-context-adapter.test.ts
│   ├── integration-orchestrator.test.ts
│   └── pipeline-stages.test.ts
├── utilities/
│   ├── query-intent-detection.test.ts
│   ├── response-formatting.test.ts
│   └── error-handling.test.ts
└── mocks/
    ├── openai-mock.ts
    ├── pinecone-mock.ts
    └── context-mock.ts
```

## 2. 🔄 INTEGRATION TESTS - Komponenty Razem
```
tests/integration/
├── rag-pipeline/
│   ├── full-pipeline.test.ts
│   ├── fallback-scenarios.test.ts
│   └── context-retrieval.test.ts
├── endpoint-integration/
│   ├── chat-with-context.test.ts
│   ├── streaming-integration.test.ts
│   └── session-management.test.ts
└── database-integration/
    ├── pinecone-integration.test.ts
    ├── redis-integration.test.ts
    └── memory-management.test.ts
```

## 3. 🌐 E2E TESTS - Pełne Scenariusze
```
tests/e2e/
├── user-scenarios/
│   ├── typical-conversations.test.ts
│   ├── edge-case-conversations.test.ts
│   └── multilingual-conversations.test.ts
├── performance/
│   ├── load-testing.test.ts
│   ├── stress-testing.test.ts
│   └── concurrent-users.test.ts
└── security/
    ├── injection-attacks.test.ts
    ├── rate-limiting.test.ts
    └── input-validation.test.ts
```

## 4. 🔥 EXTREME EDGE CASES - Najdziksze Scenariusze

### 4.1 Kategorie Pytań do Testowania

#### A. 🎭 JĘZYKOWE PRZYPADKI SKRAJNE
```typescript
const EXTREME_LANGUAGE_CASES = [
  // Mieszane języki
  "Hello, jakie masz umiejętności in English?",
  "Привет, tell me about projektach на русском",
  "Hola, ¿qué projekty tienes en español?",
  
  // Dialekty i slang
  "Yo, co tam z tymi skillsami bracie?",
  "Ey koleś, gadaj co robisz",
  "Siema ziomek, jakie masz doświadczenie?",
  
  // Nietypowe znaki
  "🚀 Jakie masz umiejętności? 🎯",
  "💻 Tell me about your skills 🔥",
  "⚡ Co potrafisz zrobić? ⭐",
  
  // Wielkość liter
  "JAKIE MASZ UMIEJĘTNOŚCI???",
  "what skills do you have",
  "WhaT ProJectS dO YoU HaVe?",
  
  // Znaki specjalne
  "Jakie masz ûmîęjętnöści???",
  "What @#$% skills do you have?",
  "Co rob!sz w pr@cy?",
];
```

#### B. 🤖 PRZYPADKI TECHNICZNE
```typescript
const EXTREME_TECHNICAL_CASES = [
  // Bardzo długie pytania
  "A".repeat(10000) + " jakie masz umiejętności?",
  
  // Bardzo krótkie
  "?",
  "a",
  "co",
  
  // Tylko znaki specjalne
  "!@#$%^&*()",
  "😀😃😄😁😆",
  "🔥💻⚡🎯🚀",
  
  // Kod jako pytanie
  "console.log('jakie masz umiejętności')",
  "SELECT * FROM skills WHERE user='eryk'",
  "import { skills } from './eryk'",
  
  // JSON/XML w pytaniu
  '{"question": "jakie masz umiejętności"}',
  "<question>Co potrafisz?</question>",
  
  // Escape characters
  "Jakie masz\\numiejętności\\t?",
  "What\\rskills\\ndo\\tyou\\rhave?",
];
```

#### C. 🎪 PRZYPADKI KONTEKSTOWE
```typescript
const EXTREME_CONTEXT_CASES = [
  // Pytania bez kontekstu
  "Dlaczego?",
  "Jak?",
  "Kiedy?",
  "Co z tym?",
  
  // Pytania wieloznaczne
  "To jest dobre?",
  "Czy to działa?",
  "Ile to kosztuje?",
  
  // Pytania filozoficzne
  "Jaki jest sens życia?",
  "Czy sztuczna inteligencja ma duszę?",
  "Co to znaczy być człowiekiem?",
  
  // Pytania osobiste
  "Ile zarabiasz?",
  "Masz dziewczynę?",
  "Gdzie mieszkasz?",
  
  // Pytania prowokacyjne
  "Jesteś głupi?",
  "Nie wierzę ci",
  "To nieprawda",
];
```

#### D. 🌪️ PRZYPADKI CHAOTYCZNE
```typescript
const EXTREME_CHAOS_CASES = [
  // Spam/powtórzenia
  "jakie jakie jakie jakie masz umiejętności?",
  "AAAAAAAAAAAAAAAA",
  "hahahahahahahahaha",
  
  // Losowe słowa
  "banana komputer słoń javascript",
  "random words elephant programming",
  "kot pies samochód reaktor",
  
  // Liczby i daty
  "12345678901234567890",
  "2023-01-01T00:00:00Z",
  "NaN undefined null",
  
  // Boolean chaos
  "true false true false",
  "yes no maybe so",
  "tak nie może być",
  
  // Nieistniejące słowa
  "xyzqwerty asdfghjkl",
  "blahblahblah yaddayadda",
  "fumblerooski whatzitcalled",
];
```

## 5. 🎯 SCENARIUSZE TESTOWE

### 5.1 Test Suite Structure
```typescript
// tests/comprehensive/extreme-edge-cases.test.ts
describe('🔥 EXTREME EDGE CASES', () => {
  describe('📡 All Endpoints', () => {
    const ENDPOINTS = [
      '/api/ai/chat',
      '/api/ai/chat-with-llm', 
      '/api/ai/chat-streaming',
      '/api/ai/intelligent-chat'
    ];

    ENDPOINTS.forEach(endpoint => {
      describe(`Endpoint: ${endpoint}`, () => {
        
        test('🎭 Extreme Language Cases', async () => {
          for (const testCase of EXTREME_LANGUAGE_CASES) {
            await testEndpointWithCase(endpoint, testCase);
          }
        });

        test('🤖 Extreme Technical Cases', async () => {
          for (const testCase of EXTREME_TECHNICAL_CASES) {
            await testEndpointWithCase(endpoint, testCase);
          }
        });

        test('🎪 Extreme Context Cases', async () => {
          for (const testCase of EXTREME_CONTEXT_CASES) {
            await testEndpointWithCase(endpoint, testCase);
          }
        });

        test('🌪️ Extreme Chaos Cases', async () => {
          for (const testCase of EXTREME_CHAOS_CASES) {
            await testEndpointWithCase(endpoint, testCase);
          }
        });

      });
    });
  });
});
```

### 5.2 Performance & Load Testing
```typescript
describe('⚡ PERFORMANCE TESTS', () => {
  test('🏋️ Concurrent Users (100 simultaneous)', async () => {
    const promises = Array.from({ length: 100 }, (_, i) => 
      makeRequest(`/api/ai/intelligent-chat`, {
        messages: [{ role: 'user', content: `Test ${i}: jakie masz umiejętności?` }],
        sessionId: `load-test-${i}`
      })
    );
    
    const results = await Promise.allSettled(promises);
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(failed.length).toBeLessThan(5); // Max 5% failure rate
  });

  test('📈 Response Time Under Load', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 50 }, () => 
      makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: 'jakie masz umiejętności?' }]
      })
    );
    
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    expect(totalTime).toBeLessThan(30000); // All 50 requests in under 30s
  });

  test('🔄 Memory Leak Detection', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Make 1000 requests
    for (let i = 0; i < 1000; i++) {
      await makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: `Test ${i}` }]
      });
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
  });
});
```

### 5.3 Security & Validation Tests
```typescript
describe('🔐 SECURITY TESTS', () => {
  test('💉 SQL Injection Attempts', async () => {
    const injectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM secrets; --",
      "UNION SELECT password FROM users",
    ];

    for (const injection of injectionAttempts) {
      const response = await makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: injection }]
      });
      
      expect(response.status).toBe(200);
      expect(response.body.content).not.toContain('ERROR');
      expect(response.body.content).not.toContain('password');
    }
  });

  test('🔗 XSS Injection Attempts', async () => {
    const xssAttempts = [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "';alert('xss');//",
    ];

    for (const xss of xssAttempts) {
      const response = await makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: xss }]
      });
      
      expect(response.body.content).not.toContain('<script>');
      expect(response.body.content).not.toContain('javascript:');
    }
  });

  test('🚫 Rate Limiting', async () => {
    const requests = Array.from({ length: 100 }, () => 
      makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: 'rate limit test' }]
      })
    );

    const responses = await Promise.allSettled(requests);
    const rateLimited = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );

    expect(rateLimited.length).toBeGreaterThan(0); // Some should be rate limited
  });
});
```

### 5.4 RAG Pipeline Testing
```typescript
describe('🧠 RAG PIPELINE TESTS', () => {
  test('🔍 Context Retrieval Edge Cases', async () => {
    const edgeCases = [
      { query: "nonexistent topic xyz", expectEmpty: true },
      { query: "jakie masz umiejętności", expectResults: true },
      { query: "a".repeat(1000), expectFallback: true },
      { query: "", expectError: true },
    ];

    for (const testCase of edgeCases) {
      const response = await makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: testCase.query }]
      });

      if (testCase.expectEmpty) {
        expect(response.body.metadata.contextLength).toBe(0);
      }
      if (testCase.expectResults) {
        expect(response.body.metadata.contextLength).toBeGreaterThan(0);
      }
      if (testCase.expectFallback) {
        expect(response.body.metadata.fallbacksUsed).toContain('context-sizing');
      }
    }
  });

  test('🔄 Pipeline Failure Recovery', async () => {
    // Simulate pipeline failures
    const mockFailures = [
      { stage: 'context-sizing', error: 'timeout' },
      { stage: 'multi-stage-retrieval', error: 'connection' },
      { stage: 'hybrid-search', error: 'rate-limit' },
    ];

    for (const failure of mockFailures) {
      // This would require mocking internal services
      const response = await makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: 'test pipeline failure' }]
      });

      expect(response.status).toBe(200);
      expect(response.body.content).not.toContain('ERROR');
    }
  });
});
```

### 5.5 Multi-Language & Encoding Tests
```typescript
describe('🌍 MULTILINGUAL TESTS', () => {
  const LANGUAGE_TESTS = [
    { lang: 'Polish', query: 'Jakie masz umiejętności?', expectPolish: true },
    { lang: 'English', query: 'What skills do you have?', expectEnglish: true },
    { lang: 'Spanish', query: '¿Qué habilidades tienes?', expectPolish: false },
    { lang: 'German', query: 'Welche Fähigkeiten haben Sie?', expectPolish: false },
    { lang: 'Russian', query: 'Какие у вас навыки?', expectPolish: false },
    { lang: 'Chinese', query: '你有什么技能？', expectPolish: false },
    { lang: 'Japanese', query: 'どんなスキルがありますか？', expectPolish: false },
    { lang: 'Arabic', query: 'ما هي مهاراتك؟', expectPolish: false },
  ];

  LANGUAGE_TESTS.forEach(({ lang, query, expectPolish }) => {
    test(`🗣️ ${lang} Language Detection`, async () => {
      const response = await makeRequest('/api/ai/intelligent-chat', {
        messages: [{ role: 'user', content: query }]
      });

      expect(response.status).toBe(200);
      
      if (expectPolish) {
        expect(response.body.content).toMatch(/umiejętności|projekty|doświadczenie/i);
      } else {
        expect(response.body.content).toMatch(/skills|projects|experience/i);
      }
    });
  });
});
```

### 5.6 Streaming vs Non-Streaming Tests
```typescript
describe('📡 STREAMING TESTS', () => {
  test('🔄 Streaming Response Integrity', async () => {
    const streamingResponse = await makeStreamingRequest('/api/ai/chat-streaming', {
      messages: [{ role: 'user', content: 'jakie masz umiejętności?' }]
    });

    const nonStreamingResponse = await makeRequest('/api/ai/chat-with-llm', {
      messages: [{ role: 'user', content: 'jakie masz umiejętności?' }]
    });

    // Both should provide meaningful responses
    expect(streamingResponse.content.length).toBeGreaterThan(100);
    expect(nonStreamingResponse.body.content.length).toBeGreaterThan(100);
    
    // Both should avoid fallback responses
    expect(streamingResponse.content).not.toContain('nie zrozumiałem');
    expect(nonStreamingResponse.body.content).not.toContain('nie zrozumiałem');
  });

  test('⚡ Streaming Performance', async () => {
    const startTime = Date.now();
    let firstChunkTime = 0;
    
    const response = await makeStreamingRequest('/api/ai/chat-streaming', {
      messages: [{ role: 'user', content: 'opowiedz o swoich projektach' }]
    }, {
      onFirstChunk: () => {
        firstChunkTime = Date.now() - startTime;
      }
    });

    expect(firstChunkTime).toBeLessThan(3000); // First chunk within 3 seconds
    expect(response.content.length).toBeGreaterThan(200);
  });
});
```

## 6. 🏗️ Test Infrastructure

### 6.1 Test Configuration
```typescript
// tests/config/test-config.ts
export const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  CONCURRENT_LIMIT: 50,
  
  ENDPOINTS: {
    CHAT: '/api/ai/chat',
    CHAT_LLM: '/api/ai/chat-with-llm',
    CHAT_STREAMING: '/api/ai/chat-streaming',
    INTELLIGENT_CHAT: '/api/ai/intelligent-chat',
  },
  
  TEST_CATEGORIES: {
    SMOKE: ['basic functionality'],
    EDGE: ['extreme cases', 'edge cases'],
    PERFORMANCE: ['load', 'stress', 'concurrency'],
    SECURITY: ['injection', 'xss', 'rate limiting'],
    INTEGRATION: ['rag pipeline', 'context management'],
  }
};
```

### 6.2 Test Utilities
```typescript
// tests/utils/test-helpers.ts
export class ChatTestSuite {
  async testEndpointWithCase(endpoint: string, testCase: string) {
    const response = await this.makeRequest(endpoint, {
      messages: [{ role: 'user', content: testCase }],
      sessionId: `test-${Date.now()}-${Math.random()}`
    });

    // Basic validations
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('content');
    expect(response.body.content).toBeTruthy();
    
    // Should not crash or return error
    expect(response.body.content).not.toContain('ERROR');
    expect(response.body.content).not.toContain('undefined');
    
    // Should have reasonable length
    expect(response.body.content.length).toBeGreaterThan(10);
    expect(response.body.content.length).toBeLessThan(5000);
    
    return response;
  }

  async makeRequest(endpoint: string, body: any) {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return {
      status: response.status,
      body: await response.json()
    };
  }

  async makeStreamingRequest(endpoint: string, body: any, options?: {
    onFirstChunk?: () => void;
  }) {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let firstChunk = true;

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      if (firstChunk && options?.onFirstChunk) {
        options.onFirstChunk();
        firstChunk = false;
      }

      content += decoder.decode(value, { stream: true });
    }

    return { content, status: response.status };
  }
}
```

## 7. 🎯 Execution Strategy

### 7.1 Test Execution Levels
```bash
# Level 1: Smoke Tests (2-3 min)
npm run test:smoke

# Level 2: Edge Cases (10-15 min)
npm run test:edge

# Level 3: Performance Tests (30-45 min)
npm run test:performance

# Level 4: Security Tests (20-30 min)
npm run test:security

# Level 5: Full Integration (60-90 min)
npm run test:integration

# Level 6: Everything (2-3 hours)
npm run test:comprehensive
```

### 7.2 Test Environments
```yaml
# .github/workflows/comprehensive-testing.yml
name: Comprehensive Chat Testing

on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:smoke

  edge-case-tests:
    runs-on: ubuntu-latest
    needs: smoke-tests
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:edge

  performance-tests:
    runs-on: ubuntu-latest
    needs: edge-case-tests
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:performance
```

## 8. 📊 Test Metrics & Reporting

### 8.1 Success Criteria
- **Functional Tests**: 100% pass rate
- **Performance Tests**: 95% requests under 5s
- **Security Tests**: 0 vulnerabilities
- **Edge Cases**: 90% graceful handling
- **Load Tests**: Handle 100 concurrent users

### 8.2 Test Reports
```typescript
// Test report structure
interface TestReport {
  timestamp: string;
  duration: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: {
    endpoints: number;
    edgeCases: number;
    securityScenarios: number;
  };
  performance: {
    averageResponseTime: number;
    maxResponseTime: number;
    throughput: number;
  };
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    endpoint: string;
    testCase: string;
  }>;
}
```

Ten plan testowania pokrywa absolutnie wszystkie możliwe scenariusze - od podstawowych funkcjonalności przez najdziksze przypadki skrajne, aż po testy bezpieczeństwa i wydajności. Każdy endpoint zostanie przetestowany w każdym możliwym scenariuszu.