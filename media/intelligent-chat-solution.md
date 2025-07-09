# Rozwiązanie dla Inteligentnego Czatu z Bazą Wektorową

## Analiza Obecnego Problemu

### Identyfikowane Issues:
1. **Sztywne odpowiedzi**: `api/ai/chat.ts` używa `generateResponse()` z pattern matchingiem zamiast LLM
2. **Brak elastyczności**: Predefined responses nie pozwalają na naturalną konwersację
3. **Niewykorzystany potencjał**: Baza wektorowa służy tylko do pobierania kontekstu, ale LLM nie może swobodnie go interpretować
4. **Brak syntezy**: System nie potrafi łączyć informacji z różnych źródeł w inteligentny sposób

### Dostępne ale niewykorzystane rozwiązania:
- `chat-with-llm.ts` - już używa OpenAI GPT z vectorowym kontekstem
- `chat-streaming.ts` - streamowanie odpowiedzi dla lepszego UX
- Zaawansowana implementacja semantic search

## Proponowane Rozwiązanie

### 1. Inteligentny System Promptów

#### A. Dynamiczny System Prompt
```typescript
const buildDynamicSystemPrompt = (userQuery: string, searchResults: any[]) => {
  const isAnalyticalQuery = /analiz|porówn|ocen|syntez|co potrafisz|umiejętności|kompetencj/i.test(userQuery);
  const isExploratoryQuery = /opowiedz|więcej|szczegół|jak|dlaczego/i.test(userQuery);
  
  const basePrompt = `
Jesteś Eryk AI - inteligentny asystent reprezentujący Eryk Orłowskiego.

TRYB KONWERSACJI: ${isAnalyticalQuery ? 'ANALITYCZNY' : isExploratoryQuery ? 'EKSPLORACYJNY' : 'NATURALNY'}

INSTRUKCJE SPECJALNE:
${isAnalyticalQuery ? `
- Dokonaj syntezy informacji z kontekstu
- Wyciągnij wzorce i połączenia między projektami
- Przedstaw analizę kompetencji i doświadczeń
- Używaj konkretnych przykładów z kontekstu
` : isExploratoryQuery ? `
- Rozwiń temat używając szczegółów z kontekstu
- Opowiadaj historie projektów
- Dodawaj kontekst branżowy i techniczny
- Wyjaśniaj decyzje projektowe i ich skutki
` : `
- Prowadź naturalną konwersację
- Używaj kontekstu do konkretnych odpowiedzi
- Zadawaj pytania zwrotne gdy potrzeba więcej info
- Dostosuj styl do charakteru pytania
`}

KONTEKST Z BAZY WIEDZY:
{context}

ZASADY ODPOWIEDZI:
1. Analizuj intent użytkownika, nie tylko słowa kluczowe
2. Łącz informacje z różnych części kontekstu
3. Przedstawiaj informacje w naturalny sposób
4. Zadawaj pytania doprecyzowujące gdy potrzeba
5. Używaj polskiego jeśli pytanie w polskim, inaczej angielskiego
`;

  return basePrompt;
};
```

#### B. Context-Aware Query Enhancement
```typescript
const enhanceUserQuery = async (userQuery: string, conversationHistory: any[]) => {
  // Analizuj historię konwersacji dla kontekstu
  const recentTopics = conversationHistory
    .slice(-3)
    .map(msg => extractTopics(msg.content))
    .flat();
  
  // Rozszerzaj query w zależności od intencji
  const queryType = analyzeQueryIntent(userQuery);
  
  switch (queryType) {
    case 'SYNTHESIS':
      return `${userQuery} projects achievements competencies analysis synthesis`;
    case 'EXPLORATION':
      return `${userQuery} details process methodology approach experience`;
    case 'COMPARISON':
      return `${userQuery} projects companies technologies roles comparison`;
    default:
      return userQuery;
  }
};
```

### 2. Zaawansowane Zarządzanie Kontekstem

#### A. Wielopoziomowe Wyszukiwanie
```typescript
const getEnhancedContext = async (userQuery: string, options: {
  conversationHistory?: any[];
  queryExpansion?: boolean;
  diversityBoost?: boolean;
}) => {
  // Poziom 1: Bezpośrednie wyszukiwanie
  const directResults = await hybridSearchPinecone(userQuery, {
    topK: 8,
    namespace: 'production',
    vectorWeight: 0.7
  });
  
  // Poziom 2: Rozszerzone wyszukiwanie dla syntezy
  const expandedQuery = await expandQueryWithSynonyms(userQuery);
  const expandedResults = await hybridSearchPinecone(expandedQuery, {
    topK: 12,
    namespace: 'production',
    vectorWeight: 0.6
  });
  
  // Poziom 3: Kontekst z historii konwersacji
  const contextualResults = options.conversationHistory 
    ? await getConversationalContext(options.conversationHistory)
    : [];
  
  // Połącz i deduplikuj
  const allResults = [...directResults, ...expandedResults, ...contextualResults];
  const uniqueResults = deduplicateByContent(allResults);
  
  // Grupuj tematycznie dla lepszej organizacji
  const groupedContext = groupResultsByTheme(uniqueResults);
  
  return formatContextForLLM(groupedContext);
};
```

#### B. Inteligentne Grupowanie Kontekstu
```typescript
const groupResultsByTheme = (results: any[]) => {
  const themes = {
    leadership: [],
    projects: [],
    technologies: [],
    achievements: [],
    methodologies: []
  };
  
  results.forEach(result => {
    const content = result.chunk.text.toLowerCase();
    
    if (content.match(/zespół|lead|manag|przywództwo/)) {
      themes.leadership.push(result);
    }
    if (content.match(/projekt|aplikacja|system|platforma/)) {
      themes.projects.push(result);
    }
    if (content.match(/technologia|react|typescript|ai|ml/)) {
      themes.technologies.push(result);
    }
    // ... inne kategorie
  });
  
  return themes;
};

const formatContextForLLM = (groupedContext: any) => {
  let formattedContext = '';
  
  Object.entries(groupedContext).forEach(([theme, results]: [string, any[]]) => {
    if (results.length > 0) {
      formattedContext += `\n### ${theme.toUpperCase()}\n`;
      results.forEach(result => {
        formattedContext += `- ${result.chunk.text}\n`;
      });
    }
  });
  
  return formattedContext;
};
```

### 3. Nowa Implementacja Chat Endpoint

#### Zastąp `api/ai/chat.ts` nową implementacją:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { getEnhancedContext, buildDynamicSystemPrompt } from './chat-intelligence';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId } = req.body;
    const userMessage = messages[messages.length - 1].content;
    
    // 1. Pobierz inteligentny kontekst z bazy wektorowej
    const context = await getEnhancedContext(userMessage, {
      conversationHistory: messages.slice(-5),
      queryExpansion: true,
      diversityBoost: true
    });
    
    // 2. Zbuduj dynamiczny system prompt
    const systemPrompt = buildDynamicSystemPrompt(userMessage, context);
    
    // 3. Przygotuj wiadomości dla LLM
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-3).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // 4. Generuj odpowiedź z LLM
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.1, // Zachęcaj do różnorodności
      frequency_penalty: 0.1 // Unikaj powtórzeń
    });
    
    const responseText = completion.choices[0]?.message?.content || '';
    
    // 5. Post-process response dla lepszego formatowania
    const formattedResponse = await postProcessResponse(responseText, userMessage);
    
    return res.status(200).json({
      content: formattedResponse,
      metadata: {
        contextLength: context.length,
        queryType: analyzeQueryIntent(userMessage),
        sessionId
      }
    });
    
  } catch (error) {
    console.error('[INTELLIGENT-CHAT] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### 4. Implementacja Memory i Context Management

#### A. Conversation Memory
```typescript
// lib/conversation-memory.ts
export class ConversationMemory {
  private conversations = new Map<string, any[]>();
  
  addMessage(sessionId: string, message: any) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }
    
    const history = this.conversations.get(sessionId)!;
    history.push({
      ...message,
      timestamp: Date.now(),
      topics: extractTopics(message.content)
    });
    
    // Zachowaj tylko ostatnie 20 wiadomości
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }
  
  getRelevantHistory(sessionId: string, currentQuery: string) {
    const history = this.conversations.get(sessionId) || [];
    
    // Znajdź powiązane wiadomości na podstawie tematów
    const currentTopics = extractTopics(currentQuery);
    
    return history.filter(msg => {
      const overlap = msg.topics.filter(topic => 
        currentTopics.includes(topic)
      ).length;
      
      return overlap > 0 || history.indexOf(msg) >= history.length - 3;
    });
  }
}
```

#### B. Adaptive Context Window
```typescript
const buildAdaptiveContext = (
  searchResults: any[], 
  conversationHistory: any[], 
  maxTokens: number = 3000
) => {
  let context = '';
  let currentTokens = 0;
  
  // Priorytet 1: Najnowsze wyniki z wysokim score
  const highScoreResults = searchResults
    .filter(r => r.score > 0.8)
    .slice(0, 5);
  
  // Priorytet 2: Różnorodność tematyczna
  const diverseResults = ensureTopicDiversity(searchResults);
  
  // Priorytet 3: Kontekst konwersacyjny
  const conversationalContext = extractConversationalContext(conversationHistory);
  
  // Buduj kontekst z priorytetami
  for (const result of [...highScoreResults, ...diverseResults]) {
    const tokenCount = estimateTokens(result.chunk.text);
    
    if (currentTokens + tokenCount > maxTokens) break;
    
    context += `${result.chunk.text}\n\n`;
    currentTokens += tokenCount;
  }
  
  return context;
};
```

### 5. Konfiguracja i Wdrożenie

#### A. Environment Variables
```bash
# .env
OPENAI_API_KEY=your_key
CONVERSATION_MEMORY_TTL=3600000  # 1 godzina
MAX_CONTEXT_TOKENS=3000
ENABLE_QUERY_EXPANSION=true
ENABLE_CONVERSATION_MEMORY=true
```

#### B. Feature Flags
```typescript
// lib/feature-flags.ts
export const FEATURES = {
  INTELLIGENT_CHAT: process.env.ENABLE_INTELLIGENT_CHAT === 'true',
  QUERY_EXPANSION: process.env.ENABLE_QUERY_EXPANSION === 'true',
  CONVERSATION_MEMORY: process.env.ENABLE_CONVERSATION_MEMORY === 'true',
  ADAPTIVE_PROMPTS: process.env.ENABLE_ADAPTIVE_PROMPTS === 'true'
};
```

## Korzyści Rozwiązania

### 1. **Naturalna Konwersacja**
- LLM może swobodnie interpretować kontekst
- Brak sztywnych szablonów odpowiedzi
- Dostosowanie stylu do typu pytania

### 2. **Inteligentna Synteza**
- Łączenie informacji z różnych części bazy
- Analiza wzorców w doświadczeniu
- Odpowiedzi na pytania wymagające analizy

### 3. **Context-Awareness**
- Pamięć konwersacji
- Rozszerzanie zapytań o kontekst
- Inteligentne grupowanie informacji

### 4. **Skalowalność**
- Cache dla często używanych kontekstów
- Adaptive token management
- Performance monitoring

## Plan Wdrożenia

### Faza 1: Podstawowa implementacja (1-2 dni)
1. Zastąp główny endpoint inteligentną implementacją
2. Dodaj dynamiczne system prompts
3. Implementuj conversation memory

### Faza 2: Zaawansowane funkcje (2-3 dni)
1. Query expansion i semantic enhancement
2. Adaptive context management
3. Monitoring i analytics

### Faza 3: Optymalizacja (1-2 dni)
1. Performance tuning
2. Cache optimization
3. A/B testing setup

### Faza 4: Monitoring i iteracja (ongoing)
1. User feedback collection
2. Response quality metrics
3. Continuous improvement

## Metryki Sukcesu

- **Response Quality Score**: Ocena naturalności odpowiedzi
- **Context Relevance**: Trafność pobieranego kontekstu  
- **Conversation Flow**: Płynność wieloturowych konwersacji
- **User Satisfaction**: Feedback użytkowników
- **Performance**: Response time, cache hit rate

Ta implementacja rozwiąże problem sztywnych odpowiedzi i pozwoli na prawdziwie inteligentną konwersację z wykorzystaniem pełnego potencjału bazy wektorowej.