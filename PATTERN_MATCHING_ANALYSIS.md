# Analiza Pattern Matching w Systemie Analizy Intencji Zapytań

## Jak działają wzorce RegEx

### 1. Struktura głównej funkcji `analyzeQueryIntent`

```typescript
export function analyzeQueryIntent(userQuery: string): QueryIntent {
  const query = userQuery.toLowerCase();
  
  // Kolejność sprawdzania wzorców:
  // 1. SYNTHESIS (najbardziej specyficzne)
  // 2. EXPLORATION 
  // 3. COMPARISON
  // 4. FACTUAL (bardzo restrykcyjne)
  // 5. CASUAL (domyślne)
  // 6. Fallback na podstawie słów kluczowych
}
```

### 2. Wzorce SYNTHESIS (żądania syntezy kompetencji)

**Obecne wzorce:**
```javascript
/jakie\s+(są\s+)?(twoje\s+)?umiejętności/.test(query) ||
/co\s+potrafisz/.test(query) ||
/your\s+(key\s+)?.*competenc/.test(query) ||
/your\s+skills/.test(query) ||
/analiz.*approach/.test(query) ||
/analyze.*approach/.test(query) ||
/przegląd.*kompetencji/.test(query) ||
/present.*capabilities/.test(query) ||
/oceń.*doświadczenie/.test(query) ||
/characterize.*work/.test(query) ||
/what\s+(are\s+)?your/.test(query) & /skills|competenc|capabilities/.test(query)
```

**Problematyczne przypadki:**
```
❌ "jakie są twoje umiejętności?"
   - Wzorzec: /jakie\s+(są\s+)?(twoje\s+)?umiejętności/
   - Problem: Nie pasuje dokładnie, brakuje elastyczności w dopasowaniu
   - Faktyczny wynik: FACTUAL (przez fallback na "jakie")
   - Oczekiwany wynik: SYNTHESIS

✅ "co potrafisz jako projektant?"
   - Wzorzec: /co\s+potrafisz/
   - Działa poprawnie: SYNTHESIS
```

### 3. Wzorce EXPLORATION (żądania rozwinięcia tematu)

**Obecne wzorce:**
```javascript
/opowiedz.*o\s+projekt/.test(query) ||
/opowiedz\s+więcej/.test(query) ||
/tell\s+me\s+about/.test(query) ||
/jak\s+wyglądał.*proces/.test(query) ||
/explain.*methodology/.test(query) ||
/opisz.*podejście/.test(query) ||
/how\s+did\s+you\s+handle/.test(query) ||
/co\s+się\s+działo/.test(query) ||
/elaborate\s+on/.test(query) ||
/więcej\s+o/.test(query) ||
/opowiedz\s+o/.test(query)
```

**Problematyczne przypadki:**
```
❌ "opowiedz więcej o projekcie Volkswagen Digital"
   - Problem: Wzorzec /opowiedz.*o\s+projekt/ vs rzeczywisty tekst
   - Nie pasuje bo jest "projekcie" a nie "projekt"
   - Faktyczny wynik: FACTUAL (przez fallback)
   - Oczekiwany wynik: EXPLORATION

❌ "tell me about your experience at Polsat Box Go"
   - Wzorzec: /tell\s+me\s+about/
   - Problem: Powinno działać, ale nie działa przez priorytety
   - Faktyczny wynik: CASUAL
   - Oczekiwany wynik: EXPLORATION
```

### 4. Wzorce COMPARISON (porównania)

**Obecne wzorce:**
```javascript
/które.*bardziej.*challenging/.test(query) ||
/które.*były.*bardziej/.test(query) ||
/porównaj/.test(query) ||
/differences?\s+between/.test(query) ||
/compare/.test(query) ||
/różnice?\s+między/.test(query) ||
/what\s+is\s+better/.test(query) ||
/podobieństwa/.test(query) ||
/contrast/.test(query) ||
/versus|vs/.test(query)
```

**Problematyczne przypadki:**
```
❌ "które projekty były bardziej challenging?"
   - Wzorzec: /które.*były.*bardziej/
   - Problem: Brakuje "challenging" w wzorcu polskim
   - Faktyczny wynik: FACTUAL (przez "które")
   - Oczekiwany wynik: COMPARISON

❌ "what is better - remote or office work?"
   - Wzorzec: /what\s+is\s+better/
   - Problem: Nie pasuje przez myślnik i dodatkowy tekst
   - Faktyczny wynik: FACTUAL (przez fallback)
   - Oczekiwany wynik: COMPARISON
```

### 5. Wzorce FACTUAL (pytania o fakty)

**Obecne wzorce (bardzo restrykcyjne):**
```javascript
/^ile\s+lat/.test(query) ||      // "ile lat..."
/^kiedy\s+/.test(query) ||       // "kiedy..."
/^gdzie\s+/.test(query) ||       // "gdzie..."
/^kto\s+/.test(query) ||         // "kto..."
/^jaki\s+był/.test(query) ||     // "jaki był..."
/^what\s+was\s+your/.test(query) ||
/^when\s+did/.test(query) ||
/^how\s+many\s+users/.test(query) ||
/^how\s+many/.test(query) ||
/^which\s+technologies\s+do/.test(query) ||
/konkretnie\s+ile/.test(query) ||
/exactly\s+how/.test(query)
```

**Problem z priorytetami:**
```
❌ Fallback FACTUAL jest za agresywny:
   if (/ile|kiedy|gdzie|when|where|how\s+many|how\s+much/.test(query)) {
     return 'FACTUAL';
   }
   
   To łapie zapytania jak:
   - "jakie są twoje umiejętności?" (przez "jakie")
   - "które projekty były bardziej challenging?" (przez "które")
   - "opowiedz więcej o projekcie" (przez fallback)
```

## Główne problemy z obecnym systemem

### 1. **Zbyt restrykcyjne wzorce**
```javascript
// Nie pasuje:
/opowiedz.*o\s+projekt/ vs "opowiedz więcej o projekcie"
//                              ^^^^^^^^^^^^^^^^^^^^^
// Brakuje elastyczności dla "projekcie" (odmiana)
```

### 2. **Zła kolejność priorytetów**
```javascript
// Kolejność powinna być:
// 1. Najbardziej specyficzne wzorce (pełne frazy)
// 2. Wzorce kontekstowe (co + umiejętności = SYNTHESIS)
// 3. Pojedyncze słowa kluczowe (ile, kiedy = FACTUAL)
// 4. Domyślne (CASUAL)
```

### 3. **Brakujące wzorce polskie**
```javascript
// Brakuje wzorców dla:
- "projekcie" (odmiana słowa "projekt")
- "umiejętności" w kontekście "jakie są"
- "challenging" w polskich zapytaniach
- "podobieństwa" bez "między"
```

### 4. **Błędny operator logiczny**
```javascript
// BŁĄD: Operator & zamiast &&
/what\s+(are\s+)?your/.test(query) & /skills|competenc|capabilities/.test(query)
//                                 ^
// Powinno być:
/what\s+(are\s+)?your/.test(query) && /skills|competenc|capabilities/.test(query)
```

## Propozycje napraw

### 1. **Poprawa wzorców SYNTHESIS**
```javascript
// Zamiast:
/jakie\s+(są\s+)?(twoje\s+)?umiejętności/

// Użyj:
/jakie\s+(są\s+)?twoje\s+umiejętności|co\s+potrafisz|umiejętności.*jakie/
```

### 2. **Poprawa wzorców EXPLORATION**
```javascript
// Zamiast:
/opowiedz.*o\s+projekt/

// Użyj:
/opowiedz.*(o|więcej).*projekt/
```

### 3. **Poprawa wzorców COMPARISON**
```javascript
// Dodaj:
/które.*bardziej|lepsze.*gorsze|porównaj.*między/
```

### 4. **Kontekstowe dopasowanie**
```javascript
// Sprawdź kontekst przed pojedynczymi słowami:
if (query.includes('jakie') && query.includes('umiejętności')) {
  return 'SYNTHESIS';
}

if (query.includes('opowiedz') && query.includes('projekt')) {
  return 'EXPLORATION';
}
```

### 5. **Poprawiona kolejność logiczna**
```javascript
function analyzeQueryIntent(userQuery: string): QueryIntent {
  const query = userQuery.toLowerCase();
  
  // 1. Pełne frazy kontekstowe (najwyższy priorytet)
  if (isSkillsQuestion(query)) return 'SYNTHESIS';
  if (isExplorationRequest(query)) return 'EXPLORATION';
  if (isComparisonRequest(query)) return 'COMPARISON';
  
  // 2. Wzorce specyficzne
  if (isFactualQuestion(query)) return 'FACTUAL';
  if (isCasualGreeting(query)) return 'CASUAL';
  
  // 3. Fallback na podstawie słów kluczowych
  return getIntentFromKeywords(query);
}
```

## Wpływ na Context Sizing

**Problem kaskadowy:**
```
Błędna intencja → Zły rozmiar kontekstu → Słaba jakość odpowiedzi

Przykład:
"jakie są twoje umiejętności?" 
→ FACTUAL (błąd)
→ 420 tokenów (za mało)
→ Powierzchowna odpowiedź

Powinno być:
"jakie są twoje umiejętności?"
→ SYNTHESIS (prawidłowe)
→ 1500+ tokenów
→ Szczegółowa synteza kompetencji
```

## Wnioski

**Główne problemy:**
1. **Wzorce są za restrykcyjne** - nie uwzględniają odmiany słów
2. **Zła kolejność priorytetów** - pojedyncze słowa przeważają nad kontekstem
3. **Brakujące wzorce polskie** - niepełne pokrycie języka polskiego
4. **Błędy operatorów logicznych** - & zamiast &&

**Rozwiązanie:**
- Przepisanie wzorców na bardziej elastyczne
- Dodanie kontekstowego dopasowania
- Poprawienie kolejności sprawdzania
- Dodanie testów dla każdego wzorca

Te zmiany są kluczowe dla osiągnięcia 95% skuteczności klasyfikacji wymaganej w Phase 1.