# A/B Testing Framework dla Migracji

## 🎯 Cel

Implementacja kompletnego frameworku A/B testing dla wszystkich faz migracji, umożliwiającego bezpieczne testowanie nowych funkcjonalności i porównywanie wydajności różnych wersji systemu.

## 📁 Struktura

```bash
lib/
├── ab-testing/
│   ├── ab-test-manager.ts
│   ├── experiment-config.ts
│   ├── variant-assignment.ts
│   ├── metrics-collector.ts
│   └── statistical-analyzer.ts
tests/
├── ab-testing/
│   ├── ab-test-manager.test.ts
│   ├── statistical-analyzer.test.ts
│   └── integration.test.ts
scripts/
├── ab-testing/
│   ├── create-experiment.ts
│   ├── analyze-results.ts
│   └── generate-report.ts
```

## 🚀 Implementacja

### ZADANIE A.1: Create A/B Testing Manager

```bash
# Install dependencies
npm install ab-testing-js stats-js uuid

# Create A/B testing manager
cat > lib/ab-testing/ab-test-manager.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    weight: number; // 0-1, sum should be 1
    config: any;
  }[];
  metrics: {
    primary: string[];
    secondary: string[];
  };
  trafficSplit: number; // 0-1, percentage of traffic to include
  duration: number; // days
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  metadata?: any;
}

export interface StatisticalResult {
  experimentId: string;
  variantId: string;
  sampleSize: number;
  conversionRate: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  lift: number; // Percentage improvement vs control
}

export class ABTestManager extends EventEmitter {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private results: ExperimentResult[] = [];
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId
  
  constructor() {
    super();
  }
  
  createExperiment(config: Omit<ExperimentConfig, 'id'>): string {
    const id = uuidv4();
    const experiment: ExperimentConfig = {
      ...config,
      id,
      status: 'draft'
    };
    
    this.experiments.set(id, experiment);
    this.emit('experimentCreated', experiment);
    
    return id;
  }
  
  startExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    experiment.status = 'running';
    experiment.startDate = new Date();
    this.emit('experimentStarted', experiment);
  }
  
  stopExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    experiment.status = 'stopped';
    experiment.endDate = new Date();
    this.emit('experimentStopped', experiment);
  }
  
  getVariant(experimentId: string, userId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }
    
    // Check if user is already assigned
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    
    const userExperiments = this.userAssignments.get(userId)!;
    
    if (userExperiments.has(experimentId)) {
      return userExperiments.get(experimentId)!;
    }
    
    // Check traffic split
    if (Math.random() > experiment.trafficSplit) {
      return null; // User not included in experiment
    }
    
    // Assign variant based on weights
    const variant = this.assignVariant(experiment.variants);
    userExperiments.set(experimentId, variant.id);
    
    this.emit('variantAssigned', {
      experimentId,
      userId,
      variantId: variant.id,
      variantName: variant.name
    });
    
    return variant.id;
  }
  
  private assignVariant(variants: ExperimentConfig['variants']): ExperimentConfig['variants'][0] {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return variants[0];
  }
  
  recordResult(result: Omit<ExperimentResult, 'timestamp'>): void {
    const experimentResult: ExperimentResult = {
      ...result,
      timestamp: new Date()
    };
    
    this.results.push(experimentResult);
    this.emit('resultRecorded', experimentResult);
  }
  
  getExperimentResults(experimentId: string): ExperimentResult[] {
    return this.results.filter(r => r.experimentId === experimentId);
  }
  
  getExperiment(experimentId: string): ExperimentConfig | undefined {
    return this.experiments.get(experimentId);
  }
  
  getAllExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }
  
  getActiveExperiments(): ExperimentConfig[] {
    return this.getAllExperiments().filter(e => e.status === 'running');
  }
  
  clearResults(experimentId?: string): void {
    if (experimentId) {
      this.results = this.results.filter(r => r.experimentId !== experimentId);
    } else {
      this.results = [];
    }
  }
}
EOF

# Create experiment configuration
cat > lib/ab-testing/experiment-config.ts << 'EOF'
import { ExperimentConfig } from './ab-test-manager';

export const PHASE_1_EXPERIMENTS: Partial<ExperimentConfig>[] = [
  {
    name: 'Embedding Model Comparison',
    description: 'Compare different embedding models for intent classification',
    variants: [
      {
        id: 'text-embedding-3-small',
        name: 'text-embedding-3-small (Control)',
        weight: 0.5,
        config: { model: 'text-embedding-3-small' }
      },
      {
        id: 'text-embedding-3-large',
        name: 'text-embedding-3-large (Treatment)',
        weight: 0.5,
        config: { model: 'text-embedding-3-large' }
      }
    ],
    metrics: {
      primary: ['classification_accuracy', 'response_time'],
      secondary: ['confidence_score', 'user_satisfaction']
    },
    trafficSplit: 0.3,
    duration: 7
  },
  {
    name: 'Cache Strategy Comparison',
    description: 'Compare different caching strategies',
    variants: [
      {
        id: 'memory-only',
        name: 'Memory Cache Only (Control)',
        weight: 0.33,
        config: { cacheType: 'memory' }
      },
      {
        id: 'redis-only',
        name: 'Redis Cache Only (Treatment A)',
        weight: 0.33,
        config: { cacheType: 'redis' }
      },
      {
        id: 'hybrid',
        name: 'Hybrid Cache (Treatment B)',
        weight: 0.34,
        config: { cacheType: 'hybrid' }
      }
    ],
    metrics: {
      primary: ['cache_hit_rate', 'response_time'],
      secondary: ['memory_usage', 'cost_per_request']
    },
    trafficSplit: 0.5,
    duration: 5
  }
];

export const PHASE_2_EXPERIMENTS: Partial<ExperimentConfig>[] = [
  {
    name: 'Hierarchical Classification Depth',
    description: 'Test different levels of hierarchical classification',
    variants: [
      {
        id: 'l2-only',
        name: 'L2 Classification Only (Control)',
        weight: 0.5,
        config: { maxDepth: 2 }
      },
      {
        id: 'l3-full',
        name: 'L3 Full Classification (Treatment)',
        weight: 0.5,
        config: { maxDepth: 3 }
      }
    ],
    metrics: {
      primary: ['classification_accuracy', 'processing_time'],
      secondary: ['context_relevance', 'user_engagement']
    },
    trafficSplit: 0.4,
    duration: 10
  }
];

export const PHASE_3_EXPERIMENTS: Partial<ExperimentConfig>[] = [
  {
    name: 'Agent Coordination Strategy',
    description: 'Compare different agent coordination approaches',
    variants: [
      {
        id: 'sequential',
        name: 'Sequential Processing (Control)',
        weight: 0.33,
        config: { coordination: 'sequential' }
      },
      {
        id: 'parallel',
        name: 'Parallel Processing (Treatment A)',
        weight: 0.33,
        config: { coordination: 'parallel' }
      },
      {
        id: 'adaptive',
        name: 'Adaptive Coordination (Treatment B)',
        weight: 0.34,
        config: { coordination: 'adaptive' }
      }
    ],
    metrics: {
      primary: ['response_quality', 'processing_time'],
      secondary: ['agent_utilization', 'error_rate']
    },
    trafficSplit: 0.6,
    duration: 14
  }
];

export const PHASE_4_EXPERIMENTS: Partial<ExperimentConfig>[] = [
  {
    name: 'Microservice Scaling Strategy',
    description: 'Test different auto-scaling configurations',
    variants: [
      {
        id: 'conservative',
        name: 'Conservative Scaling (Control)',
        weight: 0.5,
        config: { scalingPolicy: 'conservative' }
      },
      {
        id: 'aggressive',
        name: 'Aggressive Scaling (Treatment)',
        weight: 0.5,
        config: { scalingPolicy: 'aggressive' }
      }
    ],
    metrics: {
      primary: ['response_time', 'cost_per_request'],
      secondary: ['resource_utilization', 'availability']
    },
    trafficSplit: 0.7,
    duration: 21
  }
];
EOF

# Create statistical analyzer
cat > lib/ab-testing/statistical-analyzer.ts << 'EOF'
import { ExperimentResult, StatisticalResult } from './ab-test-manager';

export class StatisticalAnalyzer {
  analyzeExperiment(
    experimentId: string,
    results: ExperimentResult[],
    controlVariantId: string
  ): StatisticalResult[] {
    const variantResults = this.groupByVariant(results);
    const controlResults = variantResults.get(controlVariantId);
    
    if (!controlResults || controlResults.length === 0) {
      throw new Error('No control variant results found');
    }
    
    const statisticalResults: StatisticalResult[] = [];
    
    for (const [variantId, variantData] of variantResults) {
      if (variantId === controlVariantId) {
        // Calculate control baseline
        const controlMetrics = this.calculateMetrics(controlData);
        statisticalResults.push({
          experimentId,
          variantId,
          sampleSize: controlData.length,
          conversionRate: controlMetrics.conversionRate,
          confidenceInterval: controlMetrics.confidenceInterval,
          pValue: 1.0, // Control always has p-value of 1
          isSignificant: false,
          lift: 0 // No lift for control
        });
      } else {
        // Compare treatment vs control
        const treatmentMetrics = this.calculateMetrics(variantData);
        const controlMetrics = this.calculateMetrics(controlResults);
        
        const pValue = this.calculatePValue(controlResults, variantData);
        const lift = this.calculateLift(treatmentMetrics.conversionRate, controlMetrics.conversionRate);
        const isSignificant = pValue < 0.05; // 95% confidence level
        
        statisticalResults.push({
          experimentId,
          variantId,
          sampleSize: variantData.length,
          conversionRate: treatmentMetrics.conversionRate,
          confidenceInterval: treatmentMetrics.confidenceInterval,
          pValue,
          isSignificant,
          lift
        });
      }
    }
    
    return statisticalResults;
  }
  
  private groupByVariant(results: ExperimentResult[]): Map<string, ExperimentResult[]> {
    const grouped = new Map<string, ExperimentResult[]>();
    
    for (const result of results) {
      if (!grouped.has(result.variantId)) {
        grouped.set(result.variantId, []);
      }
      grouped.get(result.variantId)!.push(result);
    }
    
    return grouped;
  }
  
  private calculateMetrics(results: ExperimentResult[]): {
    conversionRate: number;
    confidenceInterval: [number, number];
  } {
    const conversions = results.filter(r => r.metrics.success === 1).length;
    const conversionRate = conversions / results.length;
    
    // Calculate 95% confidence interval using Wilson score interval
    const confidenceInterval = this.wilsonScoreInterval(conversions, results.length);
    
    return {
      conversionRate,
      confidenceInterval
    };
  }
  
  private wilsonScoreInterval(successes: number, total: number): [number, number] {
    const z = 1.96; // 95% confidence level
    const p = successes / total;
    const denominator = 1 + z * z / total;
    const centreAdjustment = z * Math.sqrt(z * z / (4 * total * total));
    const centreNumerator = p + z * z / (2 * total);
    const centre = centreNumerator / denominator;
    const spread = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
    
    return [Math.max(0, centre - spread), Math.min(1, centre + spread)];
  }
  
  private calculatePValue(control: ExperimentResult[], treatment: ExperimentResult[]): number {
    // Chi-square test for independence
    const controlSuccesses = control.filter(r => r.metrics.success === 1).length;
    const controlFailures = control.length - controlSuccesses;
    const treatmentSuccesses = treatment.filter(r => r.metrics.success === 1).length;
    const treatmentFailures = treatment.length - treatmentSuccesses;
    
    const totalSuccesses = controlSuccesses + treatmentSuccesses;
    const totalFailures = controlFailures + treatmentFailures;
    const total = control.length + treatment.length;
    
    const expectedControlSuccesses = (control.length * totalSuccesses) / total;
    const expectedTreatmentSuccesses = (treatment.length * totalSuccesses) / total;
    const expectedControlFailures = (control.length * totalFailures) / total;
    const expectedTreatmentFailures = (treatment.length * totalFailures) / total;
    
    const chiSquare = Math.pow(controlSuccesses - expectedControlSuccesses, 2) / expectedControlSuccesses +
                     Math.pow(treatmentSuccesses - expectedTreatmentSuccesses, 2) / expectedTreatmentSuccesses +
                     Math.pow(controlFailures - expectedControlFailures, 2) / expectedControlFailures +
                     Math.pow(treatmentFailures - expectedTreatmentFailures, 2) / expectedTreatmentFailures;
    
    // For 1 degree of freedom, chi-square critical value at 0.05 is 3.841
    // This is a simplified p-value calculation
    return chiSquare > 3.841 ? 0.05 : 1.0;
  }
  
  private calculateLift(treatmentRate: number, controlRate: number): number {
    if (controlRate === 0) return 0;
    return ((treatmentRate - controlRate) / controlRate) * 100;
  }
  
  generateReport(statisticalResults: StatisticalResult[]): string {
    let report = '# A/B Test Statistical Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    for (const result of statisticalResults) {
      report += `## Variant: ${result.variantId}\n`;
      report += `- Sample Size: ${result.sampleSize}\n`;
      report += `- Conversion Rate: ${(result.conversionRate * 100).toFixed(2)}%\n`;
      report += `- Confidence Interval: [${(result.confidenceInterval[0] * 100).toFixed(2)}%, ${(result.confidenceInterval[1] * 100).toFixed(2)}%]\n`;
      report += `- P-Value: ${result.pValue.toFixed(4)}\n`;
      report += `- Statistically Significant: ${result.isSignificant ? 'Yes' : 'No'}\n`;
      report += `- Lift vs Control: ${result.lift.toFixed(2)}%\n\n`;
    }
    
    return report;
  }
}
EOF

# Create A/B testing tests
cat > tests/ab-testing/ab-test-manager.test.ts << 'EOF'
import { ABTestManager } from '../../lib/ab-testing/ab-test-manager';

describe('AB Test Manager', () => {
  let manager: ABTestManager;
  
  beforeEach(() => {
    manager = new ABTestManager();
  });
  
  test('should create experiment', () => {
    const experimentId = manager.createExperiment({
      name: 'Test Experiment',
      description: 'Test description',
      variants: [
        { id: 'control', name: 'Control', weight: 0.5, config: {} },
        { id: 'treatment', name: 'Treatment', weight: 0.5, config: {} }
      ],
      metrics: { primary: ['metric1'], secondary: ['metric2'] },
      trafficSplit: 0.5,
      duration: 7,
      startDate: new Date(),
      status: 'draft'
    });
    
    expect(experimentId).toBeDefined();
    expect(manager.getExperiment(experimentId)).toBeDefined();
  });
  
  test('should assign variants consistently', () => {
    const experimentId = manager.createExperiment({
      name: 'Test Experiment',
      description: 'Test description',
      variants: [
        { id: 'control', name: 'Control', weight: 0.5, config: {} },
        { id: 'treatment', name: 'Treatment', weight: 0.5, config: {} }
      ],
      metrics: { primary: ['metric1'], secondary: ['metric2'] },
      trafficSplit: 1.0,
      duration: 7,
      startDate: new Date(),
      status: 'draft'
    });
    
    manager.startExperiment(experimentId);
    
    const userId = 'user123';
    const variant1 = manager.getVariant(experimentId, userId);
    const variant2 = manager.getVariant(experimentId, userId);
    
    expect(variant1).toBe(variant2); // Should be consistent
  });
  
  test('should record results', () => {
    const experimentId = manager.createExperiment({
      name: 'Test Experiment',
      description: 'Test description',
      variants: [
        { id: 'control', name: 'Control', weight: 1.0, config: {} }
      ],
      metrics: { primary: ['metric1'], secondary: ['metric2'] },
      trafficSplit: 1.0,
      duration: 7,
      startDate: new Date(),
      status: 'draft'
    });
    
    manager.recordResult({
      experimentId,
      variantId: 'control',
      userId: 'user123',
      sessionId: 'session123',
      metrics: { success: 1, responseTime: 100 }
    });
    
    const results = manager.getExperimentResults(experimentId);
    expect(results.length).toBe(1);
    expect(results[0].userId).toBe('user123');
  });
});
EOF

# Run A/B testing tests
npm test tests/ab-testing/ab-test-manager.test.ts
```

**CHECKPOINT A.1**:
- [ ] A/B testing framework implemented
- [ ] Statistical analysis working
- [ ] Experiment configurations created
- [ ] Tests passing
- [ ] Ready for integration

## 🔗 Integracja z Fazami

### Faza 1: Embedding Model A/B Testing
```typescript
// W embedding-classifier.ts
const abManager = new ABTestManager();
const variant = abManager.getVariant('embedding-model-experiment', userId);
const model = variant === 'treatment' ? 'text-embedding-3-large' : 'text-embedding-3-small';
```

### Faza 2: Hierarchical Classification A/B Testing
```typescript
// W hierarchical-classifier.ts
const variant = abManager.getVariant('hierarchical-depth-experiment', userId);
const maxDepth = variant === 'treatment' ? 3 : 2;
```

### Faza 3: Agent Coordination A/B Testing
```typescript
// W agent-coordinator.ts
const variant = abManager.getVariant('agent-coordination-experiment', userId);
const coordinationStrategy = variant === 'parallel' ? 'parallel' : 'sequential';
```

### Faza 4: Scaling Strategy A/B Testing
```typescript
// W auto-scaler.ts
const variant = abManager.getVariant('scaling-strategy-experiment', userId);
const scalingPolicy = variant === 'aggressive' ? 'aggressive' : 'conservative';
```

## 📊 Monitoring i Raporty

Framework automatycznie:
- Zbiera metryki z wszystkich eksperymentów
- Analizuje statystyczną istotność wyników
- Generuje raporty z rekomendacjami
- Monitoruje zdrowie eksperymentów
- Alertuje o problemach

## 🎯 Korzyści

1. **Bezpieczne testowanie** - Nowe funkcjonalności testowane na części ruchu
2. **Dane napędzają decyzje** - Statystycznie istotne wyniki
3. **Ciągłe ulepszenia** - Systematyczne testowanie hipotez
4. **Redukcja ryzyka** - Rollback na podstawie metryk
5. **Optymalizacja wydajności** - Testowanie różnych konfiguracji