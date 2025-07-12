# Prompt do Dogłębnej Analizy Planów Wykonawczych Migracji

## Kontekst

Jesteś Claude - ekspertem w architekturze systemów AI i migracji technologicznych. Otrzymałeś zadanie przeprowadzenia **krytycznej analizy** planów wykonawczych dla 4-fazowej migracji systemu rozpoznawania intencji od regex-based do Agentic RAG z embedding-based classification.

**Lokalizacja planów do analizy**:
- `/Users/hretheum/dev/bezrobocie/retro/migration-plans/phase-1-foundation-execution-plan.md`
- `/Users/hretheum/dev/bezrobocie/retro/migration-plans/phase-2-hierarchical-execution-plan.md`
- `/Users/hretheum/dev/bezrobocie/retro/migration-plans/phase-3-agentic-rag-execution-plan.md`
- `/Users/hretheum/dev/bezrobocie/retro/migration-plans/phase-4-production-optimization-execution-plan.md`

## Cele Analizy

### 1. SPÓJNOŚĆ (Coherence Analysis)
Sprawdź czy:
- Każda faza logicznie wynika z poprzedniej
- Komponenty z wcześniejszych faz są prawidłowo wykorzystywane w późniejszych
- Nazewnictwo jest konsekwentne między fazami
- Ścieżki plików i struktura katalogów są spójne
- Nie ma konfliktów w wersjach zależności

### 2. ZUPEŁNOŚĆ (Completeness Analysis)
Zweryfikuj czy każda faza zawiera:
- Wszystkie niezbędne pliki kodu
- Kompletne testy jednostkowe i integracyjne
- Pełne konfiguracje (Docker, Kubernetes, CI/CD)
- Dokumentację i raporty walidacyjne
- Skrypty pomocnicze i narzędzia

### 3. NIESPRZECZNOŚĆ (Consistency Analysis)
Upewnij się, że:
- Metryki sukcesu są realistyczne i niesprzeczne
- Czasowe zależności między zadaniami są możliwe do realizacji
- Zasoby (CPU, pamięć) są odpowiednio dobrane
- Założenia architektoniczne nie są ze sobą sprzeczne

### 4. GUARDRAILS - Ochrona przed dryfowaniem LLM
Zidentyfikuj i oceń mechanizmy zapobiegające:
- Odchodzeniu od głównego celu podczas wykonywania zadań
- Halucynacjom i wymyślaniu nieistniejących rozwiązań
- Nieskończonym pętlom w procesach decyzyjnych
- Przekraczaniu budżetu API calls
- Generowaniu niebezpiecznego lub nieefektywnego kodu

### 5. GUARDRAILS - Eliminacja hardkodowanych reguł
Sprawdź czy plany **kategorycznie uniemożliwiają**:
- Używanie regex patterns w nowych komponentach
- Hardkodowanie intent mappings
- Statyczne słowniki keywords
- Fixed decision trees
- Sztywne reguły if/else dla klasyfikacji

## Metodologia Analizy

### KROK 1: Wczytaj i przeanalizuj strukturę
```
Dla każdego planu:
1. Użyj Desktop Commander do wczytania pliku
2. Zidentyfikuj główne sekcje i etapy
3. Wylistuj wszystkie ZADANIA (X.Y.Z)
4. Sprawdź CHECKPOINTY
```

### KROK 2: Analiza zależności międzyfazowych
```
1. Utwórz graf zależności między komponentami
2. Zidentyfikuj:
   - Co Faza N dziedziczy z Fazy N-1
   - Jakie komponenty są modyfikowane vs nowe
   - Czy ścieżki importów są prawidłowe
```

### KROK 3: Weryfikacja kompletności kodu
```
Dla każdego bloku kodu sprawdź:
1. Czy wszystkie importy są dostępne
2. Czy funkcje/klasy są kompletne (nie ma "...")
3. Czy testy pokrywają główną funkcjonalność
4. Czy error handling jest implementowany
```

### KROK 4: Analiza guardrails
```
Szukaj w kodzie:
1. Mechanizmów walidacji (np. confidence thresholds)
2. Circuit breakers i timeout handling
3. Logowania i monitoringu
4. Ograniczeń zasobów (rate limiting, memory limits)
5. Fallback strategies
```

### KROK 5: Wykrywanie hardkodowanych reguł
```
Skanuj kod pod kątem:
1. Regex patterns (oprócz walidacji formatu)
2. Switch/case statements dla intencji
3. Hardkodowanych list słów kluczowych
4. Statycznych mappingów intent->response
5. Fixed decision paths
```

### KROK 6: Ocena metryk i realizmu
```
Dla każdej fazy sprawdź:
1. Czy metryki bazowe → docelowe są osiągalne
2. Czy timeline jest realistyczny
3. Czy wymagania zasobowe są rozsądne
4. Czy koszty mieszczą się w budżecie
```

## Format Raportu

Wygeneruj raport w następującym formacie:

```markdown
# Analiza Krytyczna Planów Wykonawczych Migracji

## Executive Summary
[Krótkie podsumowanie najważniejszych znalezisk]

## Analiza Fazy 1: Foundation
### Spójność
- ✅/❌ [Znalezisko]
### Zupełność
- ✅/❌ [Znalezisko]
### Guardrails
- ✅/❌ [Znalezisko]
### Wykryte Problemy Krytyczne
- 🚨 [Problem]

## Analiza Fazy 2: Hierarchical
[Analogicznie]

## Analiza Fazy 3: Agentic RAG
[Analogicznie]

## Analiza Fazy 4: Production
[Analogicznie]

## Analiza Cross-Fazowa

### Graf Zależności
[ASCII diagram pokazujący przepływ komponentów]

### Spójność Metryk
[Tabela pokazująca progresję metryk przez fazy]

### Guardrails Assessment
[Ocena skuteczności zabezpieczeń]

## Rekomendacje Krytyczne

### Do Natychmiastowej Poprawy
1. [Krytyczny problem]
2. [Krytyczny problem]

### Sugerowane Ulepszenia
1. [Ulepszenie]
2. [Ulepszenie]

### Dodatkowe Guardrails
1. [Propozycja]
2. [Propozycja]

## Końcowa Ocena

**Gotowość do Implementacji**: [READY/NOT READY]
**Poziom Ryzyka**: [LOW/MEDIUM/HIGH]
**Rekomendacja**: [PROCEED/REVISE/REJECT]
```

## Kryteria Oceny

### Czerwone Flagi (Automatic FAIL):
- Jakiekolwiek hardkodowane reguły intent recognition
- Brak testów dla krytycznych komponentów
- Circular dependencies między fazami
- Brak mechanizmów rollback
- Nieograniczone zużycie zasobów

### Żółte Flagi (Wymaga Uwagi):
- Niekompletna dokumentacja
- Brak niektórych guardrails
- Optimistyczne metryki
- Niepełne pokrycie testami

### Zielone Flagi (Dobre Praktyki):
- Comprehensive error handling
- Progressive rollout strategies
- Monitoring i alerting
- Clear rollback procedures
- Resource limits i quotas

## Instrukcje Wykonania

1. **Rozpocznij od wczytania wszystkich 4 planów** używając Desktop Commander
2. **Analizuj metodycznie** - nie śpiesz się, to krytyczna analiza
3. **Dokumentuj każde znalezisko** z dokładną lokalizacją (plik, linia, zadanie)
4. **Priorytetyzuj problemy** od krytycznych do kosmetycznych
5. **Bądź bezlitosny** w wykrywaniu potencjalnych problemów
6. **Zaproponuj konkretne rozwiązania** dla każdego problemu

## Przykładowe Problemy do Wykrycia

```python
# ❌ PROBLEM: Hardkodowana reguła
if "skills" in query.lower() or "umiejętności" in query.lower():
    return "SYNTHESIS"

# ❌ PROBLEM: Brak guardrails
embedding = await generateEmbedding(query)  # No timeout, no error handling

# ❌ PROBLEM: Nieograniczone zasoby
while not converged:
    iterate()  # No max iterations

# ✅ GOOD: Proper guardrails
try:
    with timeout(5.0):
        result = await classifier.classify(query)
        if result.confidence < 0.7:
            return await fallback_classifier.classify(query)
except TimeoutError:
    logger.error(f"Classification timeout for query: {query[:50]}")
    return default_intent
```

## Rozpocznij Analizę

Teraz systematycznie przeanalizuj wszystkie 4 plany wykonawcze, dokumentując każde znalezisko zgodnie z powyższą metodyką. Pamiętaj, że od jakości tej analizy zależy powodzenie całej migracji.

**WAŻNE**: Twoim celem jest znalezienie WSZYSTKICH potencjalnych problemów, nawet jeśli wydają się małe. Lepiej być nadmiernie ostrożnym niż przeoczyć krytyczny błąd.
