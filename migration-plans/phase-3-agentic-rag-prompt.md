# Prompt do Szczegółowego Planu Wykonawczego - Faza 3: Agentic RAG Implementation

## Kontekst Projektu

Pracuję nad migracją architektury czatu w projekcie Retro-Folio (portfolio Eryk Orłowski) z systemu regex-based intent detection do hierarchicznego Agentic RAG z embedding-based classification.

**Lokalizacja projektu**: `/Users/hretheum/dev/bezrobocie/retro/`

**Stack technologiczny**:
- Frontend: React 18.3.1 + TypeScript
- Backend: Vercel Functions
- Bazy danych: Pinecone (wektory), Supabase (dane)
- AI: OpenAI (GPT-4 + embeddings)

## Status Projektu

### ✅ FAZA 1 (UKOŃCZONA): Foundation - Embedding-based Intent Detection
- Embedding service z OpenAI text-embedding-3-small
- Multi-level cache z 76% hit rate
- Pinecone namespace 'intent-patterns'
- 87.3% agreement z regex baseline
- Gradual rollout controller

### ✅ FAZA 2 (UKOŃCZONA): Hierarchical Classification & Context Management
- 3-poziomowa hierarchia intencji (17 typów)
- System pamięci: Working, Episodic, Semantic
- Context integration z 89% retention
- 6 nowych komponentów UI
- Feedback mechanism

**Kluczowe komponenty z Fazy 2**:
- `lib/intent/hierarchical/hierarchical-classifier.ts`
- `lib/context/memory-manager.ts`
- `lib/context/context-integration.ts`
- Frontend components dla visualization

### 🎯 FAZA 3 (DO ZROBIENIA): Agentic RAG Implementation

**Cele**:
1. Implementacja autonomicznych agentów dla różnych zadań
2. Self-reflection mechanisms dla poprawy jakości
3. Multi-step reasoning z decomposition
4. Agent coordination i orchestration
5. Advanced debugging i monitoring

**Planowana architektura agentów**:
```
1. Intent Classification Agent - wykorzystuje hierarchical classifier
2. Context Retrieval Agent - używa memory manager
3. Response Generation Agent - tworzy odpowiedzi
4. Quality Assurance Agent - self-reflection
5. Orchestration Agent - koordynuje flow
```

## Struktura Folderów Walidacyjnych

```
/validation-reports/
├── phase-1-foundation/          # ✅ Ukończona
├── phase-2-hierarchical/        # ✅ Ukończona
└── phase-3-agentic-rag/        # 🎯 DO ZROBIENIA
    ├── phase-3-summary.md
    ├── 3.1-agent-architecture/
    │   ├── YYYY-MM-DD-[typ]-validation.md
    │   └── artifacts/
    ├── 3.2-self-reflection/
    │   ├── YYYY-MM-DD-[typ]-validation.md
    │   └── artifacts/
    └── 3.3-multi-step-reasoning/
        ├── YYYY-MM-DD-[typ]-validation.md
        └── artifacts/
```

## Zadanie

Potrzebuję **szczegółowego, wykonywalnego planu** dla Fazy 3, analogicznego do planu Fazy 2. Plan powinien zawierać:

1. **Konkretne zadania atomowe** z numeracją (3.1.1, 3.1.2, etc.)
2. **Pełny kod** każdego pliku do utworzenia (używając `cat > filename << 'EOF'`)
3. **Checkpointy** po każdym zadaniu
4. **Komendy bash** do wykonania
5. **Testy** dla każdego komponentu
6. **Raporty walidacyjne** w formacie ustalonym w poprzednich fazach

## Ważne decyzje architektoniczne z poprzednich faz

1. **Używamy parallel implementation** - nowe features działają równolegle ze starymi
2. **Feature flags** kontrolują rollout (gradual-rollout.ts)
3. **Każda zmiana max 100 linii kodu** na raz
4. **Comprehensive testing** przed każdym krokiem
5. **Wykorzystanie istniejących komponentów** z Fazy 1 i 2

## Kluczowe komponenty do wykorzystania/rozszerzenia

Z Fazy 1:
- `lib/embeddings/embedding-service.ts`
- `lib/cache/multi-level-cache.ts`
- `lib/rollout/gradual-rollout.ts`

Z Fazy 2:
- `lib/intent/hierarchical/hierarchical-classifier.ts`
- `lib/context/memory-manager.ts`
- `lib/context/context-integration.ts`
- UI components (IntentConfidenceDisplay, ContextInsightsPanel, etc.)

## Przykład formatu zadania (do naśladowania)

```
### ZADANIE 3.1.1: Create base agent framework

```bash
# Create base agent class
cat > lib/agents/base-agent.ts << 'EOF'
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
[PEŁNY KOD PLIKU - nie fragmenty]
EOF

# Create agent tests
cat > lib/agents/base-agent.test.ts << 'EOF'
[PEŁNY KOD TESTÓW]
EOF

# Run tests
npm test lib/agents/base-agent.test.ts
```

**CHECKPOINT 3.1.1**:
- [ ] Base agent class compiles
- [ ] All tests pass
- [ ] Event system works
- [ ] Komenda weryfikująca: `npm test lib/agents/base-agent.test.ts`
```

## Struktura oczekiwanego dokumentu

Stwórz artefakt "Autonomiczny Plan Wykonawczy - Faza 3: Agentic RAG Implementation" który będzie miał strukturę:

```
# Faza 3: Agentic RAG Implementation

## Etap 3.1: Agent Architecture

### ZADANIE 3.1.1: [Nazwa]
[Komendy i kod]
**CHECKPOINT 3.1.1**: [...]

### ZADANIE 3.1.2: [Nazwa]
[...]

## Etap 3.2: Self-Reflection Mechanisms

### ZADANIE 3.2.1: [Nazwa]
[...]

## Etap 3.3: Multi-Step Reasoning

### ZADANIE 3.3.1: [Nazwa]
[...]
```

## Specyficzne wymagania dla Fazy 3

### Agenty powinny:
1. Wykorzystywać hierarchiczną klasyfikację z Fazy 2
2. Mieć dostęp do context memory
3. Komunikować się przez wspólny message bus
4. Implementować retry logic i error handling
5. Generować debug logs dla troubleshooting

### Self-reflection powinno:
1. Oceniać quality score odpowiedzi
2. Identyfikować missing information
3. Sugerować improvements
4. Trigger re-generation gdy needed

### Multi-step reasoning powinno:
1. Dekomponować złożone zapytania
2. Tworzyć execution plan
3. Śledzić dependencies
4. Agregować partial results

### UI Updates dla Fazy 3:
1. Agent status visualization
2. Reasoning path display
3. Self-reflection insights
4. Debug mode dla agents

## Metryki sukcesu dla Fazy 3

- Agent coordination efficiency: >90%
- Self-reflection improvement rate: >30%
- Multi-step query success: >85%
- Latency dla simple queries: <300ms
- Latency dla complex queries: <2s
- Test coverage: >95%

## Dodatkowy kontekst

- Mamy już działający hierarchical classifier i context manager
- UI components są gotowe do rozszerzenia
- Performance monitoring jest w miejscu
- Feedback loop działa

**WAŻNE**: 
- Każdy plik musi być KOMPLETNY (nie fragmenty)
- Każde zadanie musi mieć testy
- Każdy checkpoint musi być weryfikowalny komendą
- Zachowaj numerację X.Y.Z dla wszystkich zadań
- Wykorzystuj maksymalnie komponenty z Faz 1 i 2

Proszę o stworzenie szczegółowego, technicznego planu wykonawczego dla Fazy 3, który autonomiczny agent (lub developer) będzie mógł wykonać krok po kroku bez dodatkowych pytań.