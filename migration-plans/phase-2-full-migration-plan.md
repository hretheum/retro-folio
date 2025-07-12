# Autonomiczny Plan Wykonawczy - Faza 2: Hierarchical Classification & Context Management

## 🎯 Cel Dokumentu

Ten dokument jest **samowystarczalnym przewodnikiem** dla autonomicznego agenta kodowania (lub developera) do przeprowadzenia Fazy 2 migracji - implementacji hierarchicznej klasyfikacji intencji i zaawansowanego zarządzania kontekstem.

## 📁 Struktura Projektu po Fazie 1

```
/Users/hretheum/dev/bezrobocie/retro/
├── src/
│   └── components/
│       └── ErykChatEnhanced.tsx      # Frontend chat component
├── api/
│   └── ai/
│       ├── intelligent-chat.ts       # Original endpoint
│       └── intelligent-chat-rollout.ts # With rollout control
├── lib/
│   ├── chat-intelligence.ts          # Original regex-based
│   ├── embeddings/
│   │   ├── embedding-service.ts      # ✅ Phase 1
│   │   └── similarity-calculator.ts  # ✅ Phase 1
│   ├── intent/
│   │   ├── embedding-classifier.ts   # ✅ Phase 1
│   │   └── parallel-classifier.ts    # ✅ Phase 1
│   ├── cache/
│   │   └── multi-level-cache.ts      # ✅ Phase 1
│   └── rollout/
│       └── gradual-rollout.ts        # ✅ Phase 1
└── validation-reports/               # ✅ Phase 1 reports
```