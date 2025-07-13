# Pattern Matching w Systemie Testowania i GitHub Actions

## 🔍 Przegląd Pattern Matching

Pattern matching w tym systemie działa na kilku poziomach:

### 1. **Hierarchical Intent Classification Pattern Matching**

#### Struktura Hierarchii Intencji
```typescript
export interface IntentHierarchy {
  id: string;
  name: string;
  description: string;
  level: 1 | 2 | 3;           // Poziom hierarchii
  parent?: string;            // Rodzic w hierarchii
  children?: string[];        // Dzieci w hierarchii
  keywords: string[];         // Słowa kluczowe do dopasowania
  examples: string[];         // Przykłady zapytań
  confidence_threshold: number; // Próg pewności
}
```

#### Proces Klasyfikacji (3-poziomowy)
```typescript
// Poziom 1: Domeny (professional, technical, personal, collaboration)
const level1Results = await this.classifyAtLevel(queryEmbedding, 1);

// Poziom 2: Kategorie (experience, skills, projects, programming)
const level2Results = await this.classifyAmongCandidates(queryEmbedding, level2Candidates);

// Poziom 3: Szczegóły (current_role, past_roles, achievements)
const level3Results = await this.classifyAmongCandidates(queryEmbedding, level3Candidates);
```

### 2. **Semantic Pattern Matching**

#### Embedding-based Matching
```typescript
// Generowanie embeddings dla intencji
const textToEmbed = [
  intent.name,
  intent.description,
  ...intent.keywords,
  ...intent.examples
].join(' ');

const embedding = await generateQueryEmbedding(textToEmbed);
```

#### Similarity Scoring
```typescript
// Obliczanie podobieństwa cosinus
const similarity = cosineSimilarity(queryEmbedding, intentEmbedding);
const confidence = similarity * 100;
```

### 3. **Keyword Pattern Matching**

#### Przykłady z Intent Hierarchy
```typescript
// Professional Intent
keywords: ['work', 'experience', 'career', 'professional', 'job', 'employment']

// Technical Intent  
keywords: ['code', 'programming', 'technical', 'technology', 'development']

// Personal Intent
keywords: ['personal', 'about', 'yourself', 'background', 'interests']
```

### 4. **Test Pattern Matching**

#### Wzorce Testowe
```typescript
// Test priorytetów
it('should prioritize FACTUAL over other intents when multiple patterns match', () => {
  expect(analyzeQueryIntent('ile lat doświadczenia masz i opowiedz więcej')).toBe('FACTUAL');
});

// Test wielkości liter
it('should handle capitalized queries', () => {
  expect(analyzeQueryIntent('CO POTRAFISZ JAKO PROJEKTANT?')).toBe('SYNTHESIS');
});
```

## 🔧 Algorytmy Pattern Matching

### 1. **Hierarchical Classification Algorithm**

```typescript
async classifyIntent(query: string): Promise<HierarchicalClassificationResult> {
  // 1. Generuj embedding dla zapytania
  const queryEmbedding = await this.embeddingService.generateEmbedding(query);
  
  // 2. Klasyfikuj na poziomie 1 (domeny)
  const level1Results = await this.classifyAtLevel(queryEmbedding, 1);
  const bestLevel1 = level1Results[0];
  
  // 3. Sprawdź próg pewności
  if (!bestLevel1 || bestLevel1.confidence < bestLevel1.intent.confidence_threshold) {
    return this.createFallbackResult(level1Results, metrics);
  }
  
  // 4. Klasyfikuj na poziomie 2 (kategorie)
  const level2Candidates = this.hierarchyManager.getChildrenOf(bestLevel1.intent.id);
  const level2Results = await this.classifyAmongCandidates(queryEmbedding, level2Candidates);
  
  // 5. Klasyfikuj na poziomie 3 (szczegóły)
  // ... analogicznie
  
  return this.createResult(bestLevel1, bestLevel2, bestLevel3, alternatives, metrics);
}
```

### 2. **Confidence Scoring Pattern**

```typescript
private async classifyAmongCandidates(
  queryEmbedding: number[],
  candidates: IntentHierarchy[]
): Promise<ClassificationResult[]> {
  
  const results = await Promise.all(candidates.map(async (candidate) => {
    const intentEmbedding = this.intentEmbeddings.get(candidate.id);
    if (!intentEmbedding) return null;
    
    // Oblicz podobieństwo semantyczne
    const similarity = cosineSimilarity(queryEmbedding, intentEmbedding);
    
    // Dodaj bonus za dopasowanie słów kluczowych
    const keywordBonus = this.calculateKeywordBonus(query, candidate.keywords);
    
    // Końcowa pewność
    const confidence = (similarity * 0.8) + (keywordBonus * 0.2);
    
    return {
      intent: candidate,
      confidence: confidence * 100,
      level: candidate.level
    };
  }));
  
  // Sortuj według pewności
  return results
    .filter(r => r !== null)
    .sort((a, b) => b.confidence - a.confidence);
}
```

### 3. **Keyword Bonus Algorithm**

```typescript
private calculateKeywordBonus(query: string, keywords: string[]): number {
  const queryLower = query.toLowerCase();
  const matchedKeywords = keywords.filter(keyword => 
    queryLower.includes(keyword.toLowerCase())
  );
  
  return matchedKeywords.length / keywords.length;
}
```

## 🧪 Pattern Matching w Testach

### 1. **Test Patterns dla Intent Classification**

```typescript
describe('Intent classification patterns', () => {
  test('Professional queries', () => {
    expect(classifyIntent('jakie masz doświadczenie zawodowe?')).toMatchObject({
      level1: { intent: { id: 'professional' }, confidence: expect.any(Number) },
      level2: { intent: { id: 'experience' }, confidence: expect.any(Number) }
    });
  });
  
  test('Technical queries', () => {
    expect(classifyIntent('jakie znasz języki programowania?')).toMatchObject({
      level1: { intent: { id: 'technical' }, confidence: expect.any(Number) },
      level2: { intent: { id: 'programming' }, confidence: expect.any(Number) }
    });
  });
});
```

### 2. **GitHub Actions Test Patterns**

```yaml
# Pattern matching dla różnych typów testów
- name: Run Rate Limiting Tests
  run: |
    npm test -- --testPathPattern="rate-limiting" --testNamePattern="should handle.*rate.*limit"

- name: Run Hierarchical Classification Tests  
  run: |
    npm test -- --testPathPattern="hierarchical" --testNamePattern="should classify.*intent"

- name: Run Context Management Tests
  run: |
    npm test -- --testPathPattern="context.*memory" --testNamePattern="should manage.*context"
```

## 📊 Metryki Pattern Matching

### 1. **Classification Metrics**

```typescript
export interface ClassificationMetrics {
  processingTime: number;        // Czas przetwarzania
  embeddingTime: number;         // Czas generowania embeddings
  classificationTime: number;    // Czas klasyfikacji
  totalCandidates: number;       // Liczba kandydatów
  finalCandidates: number;       // Liczba końcowych kandydatów
}
```

### 2. **Performance Benchmarks**

```typescript
it('should classify queries quickly', () => {
  const testQueries = [
    'co potrafisz jako projektant?',
    'ile lat doświadczenia masz?',
    'jakie znasz technologie?'
  ];
  
  testQueries.forEach(query => {
    const startTime = Date.now();
    const result = analyzeQueryIntent(query);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(100); // < 100ms
    expect(result).toBeDefined();
  });
});
```

## 🔄 Cykl Pattern Matching

### 1. **Preprocessing**
- Normalizacja tekstu (lowercase, trim)
- Tokenizacja
- Usuwanie stop words

### 2. **Embedding Generation**
- Generowanie wektorów semantycznych
- Cache embeddings dla wydajności

### 3. **Similarity Calculation**
- Cosine similarity
- Keyword matching bonus
- Confidence scoring

### 4. **Post-processing**
- Threshold validation
- Fallback handling
- Result ranking

## 🚀 Optymalizacje Pattern Matching

### 1. **Caching Strategy**
```typescript
private intentEmbeddings: Map<string, number[]> = new Map();
private queryCache: Map<string, ClassificationResult> = new Map();
```

### 2. **Batch Processing**
```typescript
async batchClassify(queries: string[]): Promise<HierarchicalClassificationResult[]> {
  const embeddings = await Promise.all(
    queries.map(query => this.embeddingService.generateEmbedding(query))
  );
  
  return Promise.all(
    embeddings.map(embedding => this.classifyWithEmbedding(embedding))
  );
}
```

### 3. **Parallel Processing**
```typescript
const embeddingPromises = allIntents.map(async (intent) => {
  const embedding = await generateQueryEmbedding(textToEmbed);
  this.intentEmbeddings.set(intent.id, embedding);
});

await Promise.all(embeddingPromises);
```

## 🎯 Najlepsze Praktyki

### 1. **Threshold Management**
- Ustaw odpowiednie progi pewności
- Implementuj fallback handling
- Monitoruj accuracy metrics

### 2. **Pattern Optimization**
- Regularnie aktualizuj keywords
- Dodawaj nowe przykłady
- Testuj edge cases

### 3. **Performance Monitoring**
- Śledź czasy odpowiedzi
- Monitoruj cache hit rates
- Optymalizuj embedding generation

To jest kompleksowy system pattern matching, który łączy semantyczne dopasowanie z hierarchiczną klasyfikacją intencji dla maksymalnej dokładności i wydajności.