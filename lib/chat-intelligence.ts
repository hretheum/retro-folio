import { hybridSearchPinecone } from './pinecone-vector-store';

// Query Intent Analysis
export type QueryIntent = 'SYNTHESIS' | 'EXPLORATION' | 'COMPARISON' | 'CASUAL' | 'SPECIFIC';

export function analyzeQueryIntent(userQuery: string): QueryIntent {
  const query = userQuery.toLowerCase();
  
  if (query.match(/analiz|porówn|ocen|syntez|co potrafisz|umiejętności|kompetencj|przegląd|podsumuj/)) {
    return 'SYNTHESIS';
  }
  if (query.match(/opowiedz|więcej|szczegół|jak|dlaczego|proces|historia|metodologia/)) {
    return 'EXPLORATION';
  }
  if (query.match(/versus|vs|różnic|lepsze|gorsze|wybór|alternatyw/)) {
    return 'COMPARISON';
  }
  if (query.match(/konkretny|specyficzny|dokładnie|precyzyjnie/) || query.split(' ').length <= 2) {
    return 'SPECIFIC';
  }
  
  return 'CASUAL';
}

// Dynamic System Prompt Builder
export function buildDynamicSystemPrompt(userQuery: string, context: string): string {
  const queryIntent = analyzeQueryIntent(userQuery);
  const isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(userQuery) || 
                   userQuery.toLowerCase().includes('cześć') ||
                   userQuery.toLowerCase().includes('dzień');
  
  const language = isPolish ? 'Polish' : 'English';
  const conversationMode = getConversationMode(queryIntent);
  
  return `Jesteś Eryk AI - inteligentny asystent reprezentujący Eryk Orłowskiego.

TRYB KONWERSACJI: ${conversationMode}
JĘZYK: ${language}
INTENT PYTANIA: ${queryIntent}

${getSpecificInstructions(queryIntent, isPolish)}

KONTEKST Z BAZY WIEDZY:
${context}

ZASADY ODPOWIEDZI:
1. Analizuj intent użytkownika, nie tylko słowa kluczowe
2. Łącz informacje z różnych części kontekstu jeśli to pomoże w odpowiedzi
3. Przedstawiaj informacje w naturalny, konwersacyjny sposób
4. Jeśli kontekst nie zawiera wystarczających informacji, powiedz to otwarcie
5. Zadawaj pytania doprecyzowujące gdy potrzeba więcej szczegółów
6. Używaj konkretnych przykładów z kontekstu gdy tylko możliwe
7. Dostosuj formalność odpowiedzi do charakteru pytania

${isPolish ? 
  'WAŻNE: Zawsze dodaj na końcu disclaimer: "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."' :
  'IMPORTANT: Always end with disclaimer: "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience."'
}`;
}

function getConversationMode(intent: QueryIntent): string {
  switch (intent) {
    case 'SYNTHESIS': return 'ANALITYCZNY - Dokonuj syntezy i łącz informacje';
    case 'EXPLORATION': return 'EKSPLORACYJNY - Rozwijaj tematy i opowiadaj historie';
    case 'COMPARISON': return 'PORÓWNAWCZY - Analizuj różnice i podobieństwa';
    case 'SPECIFIC': return 'PRECYZYJNY - Podawaj konkretne, zwięzłe informacje';
    default: return 'NATURALNY - Prowadź swobodną konwersację';
  }
}

function getSpecificInstructions(intent: QueryIntent, isPolish: boolean): string {
  const instructions = {
    SYNTHESIS: isPolish ? 
      `INSTRUKCJE SYNTEZY:
- Analizuj wszystkie dostępne informacje z kontekstu
- Wyciągaj wzorce i połączenia między różnymi projektami
- Przedstaw kompetencje i doświadczenia w sposób strukturalny
- Używaj konkretnych przykładów i osiągnięć
- Wskaż trendy i rozwój w karierze` :
      `SYNTHESIS INSTRUCTIONS:
- Analyze all available information from context
- Extract patterns and connections between different projects
- Present competencies and experience in structured way
- Use specific examples and achievements
- Highlight trends and career development`,
      
    EXPLORATION: isPolish ?
      `INSTRUKCJE EKSPLORACJI:
- Rozwiń temat używając szczegółów z kontekstu
- Opowiadaj historie i proces projektów
- Dodawaj kontekst branżowy i techniczny
- Wyjaśniaj decyzje projektowe i ich skutki
- Zachęcaj do dalszych pytań` :
      `EXPLORATION INSTRUCTIONS:
- Develop topics using context details
- Tell stories and project processes
- Add industry and technical context
- Explain design decisions and their effects
- Encourage follow-up questions`,
      
    COMPARISON: isPolish ?
      `INSTRUKCJE PORÓWNAWCZE:
- Identyfikuj podobieństwa i różnice
- Analizuj różne podejścia do podobnych problemów
- Wskaż ewolucję metod pracy
- Porównaj wyniki i metryki
- Przedstaw wnioski z porównania` :
      `COMPARISON INSTRUCTIONS:
- Identify similarities and differences
- Analyze different approaches to similar problems
- Show evolution of work methods
- Compare results and metrics
- Present conclusions from comparison`,
      
    SPECIFIC: isPolish ?
      `INSTRUKCJE PRECYZYJNE:
- Podawaj konkretne, zwięzłe informacje
- Używaj liczb, dat i faktów
- Odpowiadaj bezpośrednio na pytanie
- Unikaj zbędnych rozwinięć
- Zaproponuj możliwość dalszego doprecyzowania` :
      `SPECIFIC INSTRUCTIONS:
- Provide concrete, concise information
- Use numbers, dates and facts
- Answer directly to the question
- Avoid unnecessary elaboration
- Offer possibility of further clarification`,
      
    default: isPolish ?
      `INSTRUKCJE NATURALNE:
- Prowadź swobodną, przyjazną konwersację
- Dostosuj ton do charakteru pytania
- Używaj kontekstu do konkretnych odpowiedzi
- Bądź autentyczny w stylu Eryka
- Zadawaj pytania zwrotne gdy potrzeba` :
      `NATURAL INSTRUCTIONS:
- Lead free, friendly conversation
- Adjust tone to question character
- Use context for specific answers
- Be authentic in Eryk's style
- Ask follow-up questions when needed`
  };
  
  return instructions[intent];
}

// Enhanced Context Retrieval
export async function getEnhancedContext(userQuery: string, options: {
  conversationHistory?: any[];
  queryExpansion?: boolean;
  diversityBoost?: boolean;
  maxResults?: number;
} = {}): Promise<string> {
  const { queryExpansion = true, diversityBoost = true, maxResults = 15 } = options;
  
  try {
    // 1. Direct search with original query
    const directResults = await hybridSearchPinecone(userQuery, {
      topK: Math.ceil(maxResults * 0.6),
      namespace: 'production',
      vectorWeight: 0.7
    });
    
    // 2. Enhanced search with expanded query
    let expandedResults: any[] = [];
    if (queryExpansion) {
      const expandedQuery = enhanceQuery(userQuery);
      if (expandedQuery !== userQuery) {
        expandedResults = await hybridSearchPinecone(expandedQuery, {
          topK: Math.ceil(maxResults * 0.4),
          namespace: 'production',
          vectorWeight: 0.6
        });
      }
    }
    
    // 3. Combine and deduplicate
    const allResults = [...directResults, ...expandedResults];
    const uniqueResults = deduplicateResults(allResults);
    
    // 4. Apply diversity boost if needed
    const finalResults = diversityBoost 
      ? ensureResultDiversity(uniqueResults)
      : uniqueResults.slice(0, maxResults);
    
    // 5. Group by themes for better organization
    const groupedContext = groupResultsByTheme(finalResults);
    
    return formatContextForLLM(groupedContext);
    
  } catch (error) {
    console.error('[ENHANCED-CONTEXT] Error:', error);
    return '';
  }
}

// Query Enhancement
function enhanceQuery(userQuery: string): string {
  const queryIntent = analyzeQueryIntent(userQuery);
  const baseQuery = userQuery.toLowerCase();
  
  // Add context keywords based on intent
  const enhancementMap: Record<QueryIntent, string[]> = {
    SYNTHESIS: ['projects', 'achievements', 'competencies', 'experience', 'skills'],
    EXPLORATION: ['details', 'process', 'methodology', 'approach', 'background'],
    COMPARISON: ['different', 'various', 'comparison', 'alternatives', 'options'],
    SPECIFIC: ['specific', 'exact', 'particular', 'details'],
    CASUAL: ['experience', 'work', 'projects']
  };
  
  const enhancements = enhancementMap[queryIntent];
  
  // Add relevant keywords that aren't already in the query
  const newKeywords = enhancements.filter(keyword => 
    !baseQuery.includes(keyword.toLowerCase())
  );
  
  if (newKeywords.length > 0) {
    return `${userQuery} ${newKeywords.slice(0, 2).join(' ')}`;
  }
  
  return userQuery;
}

// Result Deduplication
function deduplicateResults(results: any[]): any[] {
  const seen = new Map<string, any>();
  
  results.forEach(result => {
    const text = result.chunk.text;
    const key = text.substring(0, 100).toLowerCase().trim();
    
    // Keep the result with higher score
    if (!seen.has(key) || result.score > seen.get(key).score) {
      seen.set(key, result);
    }
  });
  
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

// Ensure Topic Diversity
function ensureResultDiversity(results: any[]): any[] {
  const themes = new Map<string, any[]>();
  const maxPerTheme = 3;
  
  // Group by themes
  results.forEach(result => {
    const theme = identifyTheme(result.chunk.text);
    if (!themes.has(theme)) {
      themes.set(theme, []);
    }
    if (themes.get(theme)!.length < maxPerTheme) {
      themes.get(theme)!.push(result);
    }
  });
  
  // Flatten back to array
  const diverseResults: any[] = [];
  themes.forEach(themeResults => {
    diverseResults.push(...themeResults);
  });
  
  return diverseResults.sort((a, b) => b.score - a.score);
}

// Theme Identification
function identifyTheme(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/zespół|lead|manag|przywództwo|team|leadership/)) {
    return 'leadership';
  }
  if (lowerText.match(/projekt|aplikacja|system|platforma|product/)) {
    return 'projects';
  }
  if (lowerText.match(/technologia|react|typescript|ai|ml|tech/)) {
    return 'technology';
  }
  if (lowerText.match(/design|ui|ux|interface|visual/)) {
    return 'design';
  }
  if (lowerText.match(/osiągnięcie|wynik|sukces|achievement|result/)) {
    return 'achievements';
  }
  
  return 'general';
}

// Group Results by Theme
function groupResultsByTheme(results: any[]): Record<string, any[]> {
  const themes: Record<string, any[]> = {
    leadership: [],
    projects: [],
    technology: [],
    design: [],
    achievements: [],
    general: []
  };
  
  results.forEach(result => {
    const theme = identifyTheme(result.chunk.text);
    themes[theme].push(result);
  });
  
  return themes;
}

// Format Context for LLM
export function formatContextForLLM(groupedContext: Record<string, any[]>): string {
  let formattedContext = '';
  
  // Priority order for themes
  const themeOrder = ['projects', 'achievements', 'leadership', 'technology', 'design', 'general'];
  
  themeOrder.forEach(theme => {
    const results = groupedContext[theme];
    if (results && results.length > 0) {
      formattedContext += `\n### ${theme.toUpperCase()}\n`;
      results.forEach(result => {
        const relevanceScore = Math.round(result.score * 100);
        formattedContext += `- ${result.chunk.text} [relevance: ${relevanceScore}%]\n`;
      });
      formattedContext += '\n';
    }
  });
  
  return formattedContext.trim();
}

// Extract Topics from Text
export function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Technology topics
  if (lowerText.match(/react|typescript|javascript|ai|ml/)) topics.push('technology');
  if (lowerText.match(/design|ui|ux|interface/)) topics.push('design');
  if (lowerText.match(/leadership|team|management/)) topics.push('leadership');
  if (lowerText.match(/project|product|application/)) topics.push('projects');
  if (lowerText.match(/achievement|success|result/)) topics.push('achievements');
  
  // Company topics
  if (lowerText.match(/volkswagen|vw/)) topics.push('volkswagen');
  if (lowerText.match(/polsat|tvp/)) topics.push('media');
  if (lowerText.match(/bank|fintech|financial/)) topics.push('finance');
  
  return [...new Set(topics)]; // Remove duplicates
}

// Post-process Response
export async function postProcessResponse(responseText: string, userQuery: string): Promise<string> {
  // Clean up any formatting issues
  let processed = responseText.trim();
  
  // Ensure proper disclaimer placement
  const isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(userQuery);
  const disclaimer = isPolish 
    ? "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."
    : "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience.";
  
  if (!processed.includes(disclaimer)) {
    processed += `\n\n${disclaimer}`;
  }
  
  return processed;
}