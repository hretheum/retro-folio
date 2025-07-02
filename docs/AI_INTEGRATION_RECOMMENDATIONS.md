# Rekomendacje integracji Eryk AI z retro-folio

## Executive Summary

Ten dokument przedstawia rekomendacje integracji AI agenta Eryk z portfolio retro-folio, wykorzystując doświadczenia z projektów hireverse i folio. Głównym celem jest stworzenie inteligentnego czatu, który odpowiada na pytania rekruterek, korzystając z wiedzy o projektach i eksperymentach przechowywanych w CMS.

## Analiza obecnej sytuacji

### Zasoby w retro-folio
- ✅ CMS z pełną edycją treści (Work, Timeline, Experiments, Leadership, Contact)
- ✅ Redis/Vercel KV dla storage
- ✅ React z TypeScript
- ✅ API endpoints dla CRUD operations
- ❌ Brak integracji AI
- ❌ Brak wektorowej bazy danych
- ❌ Brak systemu embeddingów

### Czego możemy się nauczyć z innych projektów

**Z hireverse:**
- System agentów z personality (Eryk)
- pgvector dla semantic search
- Streaming responses
- Privacy-first approach
- Multi-tone conversations
- Real-time analysis

**Z folio:**
- Markdown-based content system
- Progressive enhancement (naive → RAG)
- Modular AI integration
- Cache strategy
- Knowledge generation z content

## Architektura rekomendowana

### Faza 1: Naive RAG (2-3 dni)

**Cel:** Szybkie MVP z podstawowym semantic search

```
CMS Content → JSON Export → OpenAI Embeddings → In-Memory Vector Store
     ↓                                               ↓
User Query → Embedding → Cosine Similarity → Top K Results
     ↓
System Prompt + Context → GPT-4 → Response
```

**Implementacja:**
1. Endpoint `/api/ai/prepare` - generuje embeddingi z CMS
2. In-memory vector store (np. używając `vectra` lub `hnswlib-node`)
3. Endpoint `/api/ai/chat` - obsługa czatu
4. Komponent `<ErykChat />` w Contact section

**Stack:**
- OpenAI API dla embeddingów i chat
- Vectra/hnswlib dla lokalnego vector search
- Vercel Edge Functions

### Faza 2: Production RAG (1-2 tygodnie)

**Cel:** Skalowalna architektura z persistent storage

```
CMS Update → Webhook → Embedding Service → pgvector (Supabase/Neon)
                            ↓
                    Redis Cache (embeddings)
                            ↓
User Query → API Gateway → Similarity Search → Reranking
                            ↓
                    Enhanced Context Builder
                            ↓
            GPT-4 with Function Calling → Response
```

**Komponenty:**
1. **Embedding Pipeline:**
   - Automatyczne generowanie przy CMS update
   - Chunking strategy (max 512 tokens)
   - Metadata extraction (type, date, tags)

2. **Vector Database:**
   - Supabase z pgvector extension
   - Indeksy HNSW dla szybkiego wyszukiwania
   - Backup w Redis dla cache

3. **Query Enhancement:**
   - Query expansion
   - Hybrid search (vector + keyword)
   - Reranking z cross-encoder

### Faza 3: Advanced Multi-Agent System (1 miesiąc+)

**Cel:** Inteligentny system z multiple agents i learning capabilities

```
                    ┌─────────────────┐
                    │   Orchestrator   │
                    │     Agent        │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────┴─────┐        ┌────┴─────┐        ┌────┴─────┐
   │  Search  │        │  Analyst │        │   Eryk   │
   │  Agent   │        │  Agent   │        │  Agent   │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                    │                    │
   pgvector +           Project Data         Personality +
   Hybrid Search        Analysis             Conversation
```

**Funkcjonalności:**
- **Search Agent:** Semantic + keyword search, query understanding
- **Analyst Agent:** Deep dive w projekty, generowanie insights
- **Eryk Agent:** Personality layer, multi-tone responses
- **Orchestrator:** Routing, context building, response synthesis

**Learning Loop:**
- Tracking skuteczności odpowiedzi
- A/B testing różnych strategii
- Continuous improvement embeddingów

## Szczegółowa implementacja Fazy 1

### 1. Przygotowanie danych

```typescript
// /api/ai/prepare/route.ts
import { OpenAI } from 'openai';
import { getRedisClient } from '@/lib/redis';

const openai = new OpenAI();

export async function POST(req: Request) {
  // Pobierz wszystkie dane z CMS
  const content = await fetchAllCMSContent();
  
  // Przygotuj chunks
  const chunks = prepareChunks(content);
  
  // Generuj embeddingi
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.text,
      });
      return {
        ...chunk,
        embedding: response.data[0].embedding
      };
    })
  );
  
  // Zapisz w Redis/Memory
  await storeEmbeddings(embeddings);
  
  return Response.json({ success: true, count: embeddings.length });
}
```

### 2. Chat endpoint

```typescript
// /api/ai/chat/route.ts
import { OpenAI } from 'openai';
import { searchSimilar } from '@/lib/vector-search';

const ERYK_PROMPT = `
Jesteś Eryk AI - sarkastycznym ale pomocnym agentem reprezentującym Eryka Orowskiego.
Odpowiadasz na pytania rekruterek o jego doświadczenie, projekty i umiejętności.
Używaj wiedzy z kontekstu, ale zachowuj osobowość - jesteś profesjonalny ale z nutą humoru.
`;

export async function POST(req: Request) {
  const { message } = await req.json();
  
  // Znajdź relevantny kontekst
  const context = await searchSimilar(message, { topK: 5 });
  
  // Buduj prompt
  const messages = [
    { role: 'system', content: ERYK_PROMPT },
    { role: 'system', content: `Kontekst:\n${formatContext(context)}` },
    { role: 'user', content: message }
  ];
  
  // Streaming response
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    stream: true,
    temperature: 0.7
  });
  
  return new Response(stream);
}
```

### 3. React Component

```tsx
// /components/ErykChat.tsx
import { useState } from 'react';
import { useChat } from 'ai/react';

export function ErykChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat'
  });
  
  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 border border-blue-500/30">
      <div className="flex items-center mb-4">
        <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
        <h3 className="text-xl font-bold">Porozmawiaj z Eryk AI</h3>
      </div>
      
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Zapytaj o projekty, doświadczenie..."
          className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? <Spinner /> : 'Wyślij'}
        </button>
      </form>
    </div>
  );
}
```

## Integracja z obecnym CMS

### Auto-update embeddingów

```typescript
// Dodaj do hooks/useContent.ts
const updateWithEmbedding = async (content: any) => {
  // Update w CMS
  await updateContent(content);
  
  // Trigger embedding update
  await fetch('/api/ai/prepare', {
    method: 'POST',
    body: JSON.stringify({ type: content.type, id: content.id })
  });
};
```

### Metadata dla lepszego search

```typescript
interface ContentWithMetadata {
  id: string;
  type: 'work' | 'timeline' | 'experiment' | 'leadership';
  title: string;
  content: string;
  metadata: {
    date?: string;
    tags?: string[];
    technologies?: string[];
    role?: string;
    impact?: string;
  };
}
```

## Metryki i monitoring

### Co mierzyć:
1. **Response relevance:** Czy AI odpowiada na temat?
2. **Context precision:** Czy wybiera właściwe chunks?
3. **Response time:** Jak szybko generuje odpowiedź?
4. **User satisfaction:** Feedback od rekruterek

### Implementacja:

```typescript
// Logowanie interakcji
interface ChatInteraction {
  id: string;
  query: string;
  context: string[];
  response: string;
  feedback?: 'helpful' | 'not_helpful';
  timestamp: Date;
}

// Analiza skuteczności
const analyzePerformance = async () => {
  const interactions = await getInteractions();
  return {
    avgResponseTime: calculateAvgTime(interactions),
    helpfulRate: calculateHelpfulRate(interactions),
    topQueries: extractTopQueries(interactions),
    weakAreas: identifyWeakAreas(interactions)
  };
};
```

## Privacy i bezpieczeństwo

### Rekomendacje:
1. **Brak przechowywania danych osobowych** rekruterek
2. **Auto-usuwanie** logów po 30 dniach
3. **Rate limiting** na API endpoints
4. **Sanityzacja** inputów przed embeddingiem
5. **Opcjonalny feedback** bez identyfikacji

```typescript
// Rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});
```

## Roadmapa implementacji

### Tydzień 1: MVP
- [ ] Setup OpenAI API
- [ ] Podstawowy embedding pipeline
- [ ] In-memory vector search
- [ ] Prosty chat UI
- [ ] Integracja z Contact section

### Tydzień 2-3: Production Ready
- [ ] Migracja do Supabase/pgvector
- [ ] Cache strategy z Redis
- [ ] Advanced search (hybrid)
- [ ] Monitoring i analytics
- [ ] A/B testing framework

### Miesiąc 2: Advanced Features
- [ ] Multi-agent architecture
- [ ] Learning loop
- [ ] Voice interface (opcjonalnie)
- [ ] Personalizacja per rekruter
- [ ] Export conversations

## Koszty

### Faza 1 (MVP):
- OpenAI API: ~$20-50/miesiąc
- Vercel: Free tier wystarcza

### Faza 2 (Production):
- OpenAI API: ~$100-200/miesiąc
- Supabase: $25/miesiąc
- Redis (Upstash): $10/miesiąc

### Faza 3 (Scale):
- OpenAI API: $200-500/miesiąc
- Infrastructure: ~$100/miesiąc
- Monitoring: ~$50/miesiąc

## Podsumowanie

Rekomendowana ścieżka to rozpoczęcie od Fazy 1 (Naive RAG) aby szybko dostarczyć wartość, a następnie iteracyjne ulepszanie systemu. Kluczowe jest zachowanie modularności, aby móc łatwo wymieniać komponenty (np. zmiana modelu AI, dodanie nowych źródeł danych).

Największą wartością będzie stworzenie unikalnego doświadczenia, gdzie rekruterki mogą naturalnie pytać o Twoje doświadczenie i projekty, a AI Eryk odpowiada z charakterystyczną osobowością, jednocześnie dostarczając merytoryczne informacje.