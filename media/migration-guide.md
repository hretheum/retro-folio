# Przewodnik Migracji do Inteligentnego Czatu

## Przegląd Zmian

Obecny system używa sztywnych, predefiniowanych odpowiedzi w `api/ai/chat.ts`. Nowe rozwiązanie zastępuje to naturalną konwersacją z LLM wykorzystującą:

- **Dynamiczne system prompts** dostosowane do intencji użytkownika
- **Inteligentne wyszukiwanie** w bazie wektorowej z query expansion
- **Pamięć konwersacji** dla kontekstu wieloturowych rozmów
- **Adaptacyjne zarządzanie kontekstem** w zależności od typu pytania

## Krok 1: Przygotowanie Zależności

### 1.1 Sprawdź istniejące pakiety
```bash
# Sprawdź czy są już zainstalowane
npm list openai @vercel/node @types/node

# Jeśli brakuje, zainstaluj
npm install openai @vercel/node
npm install --save-dev @types/node
```

### 1.2 Dodaj zmienne środowiskowe
```bash
# .env
OPENAI_API_KEY=your_existing_key
CONVERSATION_MEMORY_MAX_MESSAGES=20
CONVERSATION_MEMORY_TTL=3600000
ENABLE_INTELLIGENT_CHAT=true
ENABLE_QUERY_EXPANSION=true
ENABLE_CONVERSATION_MEMORY=true
```

## Krok 2: Implementacja Nowych Modułów

### 2.1 Skopiuj nowe pliki
- `lib/chat-intelligence.ts` - Core intelligence logic
- `lib/conversation-memory.ts` - Conversation management  
- `api/ai/intelligent-chat.ts` - New chat endpoint

### 2.2 Aktualizuj importy w conversation-memory.ts
```typescript
// Zamień
const conversationMemory = new ConversationMemory({
  maxMessages: parseInt(process.env.CONVERSATION_MEMORY_MAX_MESSAGES || '20'),
  sessionTTL: parseInt(process.env.CONVERSATION_MEMORY_TTL || '3600000')
});

// Na
const conversationMemory = new ConversationMemory({
  maxMessages: 20,
  sessionTTL: 3600000
});
```

## Krok 3: Konfiguracja Routingu

### 3.1 Zaktualizuj routing w aplikacji
```typescript
// W src/components gdzie obsługujesz chat API calls

// Stara implementacja
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, sessionId })
});

// Nowa implementacja
const response = await fetch('/api/ai/intelligent-chat', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, sessionId })
});
```

### 3.2 Obsługa metadanych w odpowiedzi
```typescript
// Nowa struktura odpowiedzi zawiera dodatkowe metadane
interface ChatResponse {
  content: string;
  metadata: {
    queryIntent: string;
    contextLength: number;
    responseTime: number;
    tokensUsed: number;
    sessionId: string;
    conversationLength: number;
  };
}

// Obsługa w komponencie
const handleResponse = (response: ChatResponse) => {
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: response.content
  }]);
  
  // Opcjonalnie log metadanych do analytics
  console.log('Chat metrics:', response.metadata);
};
```

## Krok 4: Testowanie Migracji

### 4.1 Test A/B
```typescript
// Tymczasowo obsługuj oba endpointy
const useIntelligentChat = process.env.ENABLE_INTELLIGENT_CHAT === 'true';

const endpoint = useIntelligentChat 
  ? '/api/ai/intelligent-chat'
  : '/api/ai/chat';
```

### 4.2 Testy funkcjonalne
```bash
# Test podstawowy
curl -X POST http://localhost:3000/api/ai/intelligent-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "co potrafisz jako projektant?"}],
    "sessionId": "test-session"
  }'

# Test syntezy
curl -X POST http://localhost:3000/api/ai/intelligent-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "przeanalizuj moje kompetencje w designie"}],
    "sessionId": "test-session"
  }'

# Test konwersacji wieloturowej
curl -X POST http://localhost:3000/api/ai/intelligent-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "opowiedz o projektach"},
      {"role": "assistant", "content": "..."},
      {"role": "user", "content": "a co z Volkswagenem?"}
    ],
    "sessionId": "test-session"
  }'
```

## Krok 5: Monitoring i Optymalizacja

### 5.1 Dodaj monitoring endpoint
```typescript
// api/ai/chat-metrics.ts
import { getPerformanceMetrics } from './intelligent-chat';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const metrics = getPerformanceMetrics();
  return res.status(200).json(metrics);
}
```

### 5.2 Dashborard metryk
```typescript
// W komponencie admin/dashboard
const fetchMetrics = async () => {
  const response = await fetch('/api/ai/chat-metrics');
  const metrics = await response.json();
  
  return {
    averageResponseTime: metrics.averageResponseTime,
    requestCount: metrics.requestCount,
    activeSessions: metrics.conversationMetrics.activeSessions,
    mostCommonTopics: metrics.conversationMetrics.mostCommonTopics
  };
};
```

## Krok 6: Finalizacja Migracji

### 6.1 Backup starej implementacji
```bash
# Zachowaj backup
cp api/ai/chat.ts api/ai/chat-legacy.ts
```

### 6.2 Zastąp główny endpoint
```typescript
// api/ai/chat.ts - zastąp zawartość
export { default } from './intelligent-chat';
```

### 6.3 Cleanup
Po potwierdzeniu że wszystko działa:
```bash
# Usuń niepotrzebne pliki
rm api/ai/chat-legacy.ts
rm api/ai/chat-with-llm.ts  # jeśli nie używane gdzie indziej

# Aktualizuj importy w aplikacji do /api/ai/chat
```

## Krok 7: Dalsze Optymalizacje

### 7.1 Caching
```typescript
// Dodaj Redis cache dla częstych zapytań
// lib/query-cache.ts
import { createClient } from 'redis';

export class QueryCache {
  private client = createClient({ url: process.env.REDIS_URL });
  
  async get(queryHash: string): Promise<string | null> {
    return await this.client.get(`query:${queryHash}`);
  }
  
  async set(queryHash: string, response: string, ttl = 300): Promise<void> {
    await this.client.setEx(`query:${queryHash}`, ttl, response);
  }
}
```

### 7.2 Fine-tuning prompts
```typescript
// lib/prompt-optimization.ts
export const DOMAIN_SPECIFIC_PROMPTS = {
  design: "Focus on design thinking, user experience, and visual solutions...",
  leadership: "Emphasize team management, decision making, and people skills...",
  technology: "Highlight technical expertise, implementation details, and innovation..."
};

export function enhancePromptForDomain(basePrompt: string, domain: string): string {
  const domainPrompt = DOMAIN_SPECIFIC_PROMPTS[domain];
  return domainPrompt ? `${basePrompt}\n\nDOMAIN FOCUS: ${domainPrompt}` : basePrompt;
}
```

## Weryfikacja Sukcesu

### Przed migracją:
- ❌ Sztywne, predefiniowane odpowiedzi
- ❌ Brak syntezy informacji z różnych źródeł
- ❌ Rozmowy bez kontekstu
- ❌ Jednakowe odpowiedzi na podobne pytania

### Po migracji:
- ✅ Naturalne, kontekstowe odpowiedzi
- ✅ Inteligentna synteza z bazy wektorowej
- ✅ Pamięć konwersacji i context-awareness
- ✅ Dostosowanie stylu do intencji użytkownika
- ✅ Elastyczne zarządzanie kontekstem
- ✅ Performance monitoring i analytics

## Troubleshooting

### Problem: "Cannot find module" errors
**Rozwiązanie**: 
```bash
npm install --save-dev @types/node
npm install openai @vercel/node
```

### Problem: Zbyt długie response times
**Rozwiązanie**:
```typescript
// Zmniejsz maxResults w getEnhancedContext
const vectorContext = await getEnhancedContext(userQuery, {
  maxResults: 8, // było 15
  queryExpansion: false // dla prostych pytań
});
```

### Problem: Nierelewantne odpowiedzi
**Rozwiązanie**:
```typescript
// Zwiększ minScore w vector search
const searchResults = await hybridSearchPinecone(userQuery, {
  topK: 10,
  minScore: 0.7, // było 0.5
  namespace: 'production'
});
```

### Problem: Memory leaks w conversation memory
**Rozwiązanie**:
```typescript
// Zmniejsz TTL i maxMessages
const conversationMemory = new ConversationMemory({
  maxMessages: 10, // było 20
  sessionTTL: 1800000 // 30 minut zamiast godziny
});
```

## Następne Kroki

1. **Implementuj feedback loop** - zbieraj oceny użytkowników
2. **Dodaj A/B testing** dla różnych strategii promptów
3. **Rozważ fine-tuning** własnego modelu na danych Eryka
4. **Implementuj semantic caching** dla podobnych zapytań
5. **Dodaj multi-modal support** (obrazy, dokumenty)

Ta migracja transformuje twój chatbot ze sztywnego systemu w prawdziwie inteligentnego asystenta wykorzystującego pełen potencjał LLM i bazy wektorowej.