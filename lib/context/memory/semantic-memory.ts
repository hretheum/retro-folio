import { QueryIntent } from '../../chat-intelligence';
import { ContentChunk, SearchResult } from '../../types';

export interface SemanticConcept {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  relatedConcepts: string[];
  importance: number;
  lastAccessed: number;
  accessCount: number;
  metadata: {
    source: string;
    confidence: number;
    domain: string;
    created: number;
    updated: number;
  };
}

export interface SemanticRelation {
  id: string;
  fromConcept: string;
  toConcept: string;
  relationType: 'is_a' | 'part_of' | 'related_to' | 'opposite_of' | 'example_of' | 'causes' | 'used_for';
  strength: number;
  bidirectional: boolean;
  metadata: {
    source: string;
    confidence: number;
    created: number;
  };
}

export interface SemanticMemoryStats {
  totalConcepts: number;
  totalRelations: number;
  categoryCounts: Record<string, number>;
  relationTypeCounts: Record<string, number>;
  averageImportance: number;
  memoryUtilization: number;
  topConcepts: Array<{ name: string; importance: number; accessCount: number }>;
}

export interface ConceptQuery {
  name?: string;
  category?: string;
  keywords?: string[];
  minImportance?: number;
  domain?: string;
  limit?: number;
  includeRelated?: boolean;
  relationType?: SemanticRelation['relationType'];
}

export class SemanticMemory {
  private concepts: Map<string, SemanticConcept> = new Map();
  private relations: Map<string, SemanticRelation> = new Map();
  private nameIndex: Map<string, string> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private keywordIndex: Map<string, Set<string>> = new Map();
  private relationIndex: Map<string, Set<string>> = new Map();
  private maxConcepts: number = 5000;
  private maxRelations: number = 10000;

  constructor(maxConcepts: number = 5000, maxRelations: number = 10000) {
    this.maxConcepts = maxConcepts;
    this.maxRelations = maxRelations;
  }

  /**
   * Store a semantic concept
   */
  storeConcept(
    name: string,
    description: string,
    category: string,
    keywords: string[] = [],
    domain: string = 'general',
    source: string = 'unknown',
    confidence: number = 0.8
  ): string {
    const conceptId = this.generateConceptId(name);
    const now = Date.now();
    
    // Check if concept already exists
    const existingId = this.nameIndex.get(name.toLowerCase());
    if (existingId) {
      return this.updateConcept(existingId, { description, category, keywords, domain, confidence });
    }

    // Check capacity
    if (this.concepts.size >= this.maxConcepts) {
      this.evictLeastImportantConcepts();
    }

    const concept: SemanticConcept = {
      id: conceptId,
      name,
      description,
      category,
      keywords: keywords.map(k => k.toLowerCase()),
      relatedConcepts: [],
      importance: this.calculateConceptImportance(name, description, category, keywords),
      lastAccessed: now,
      accessCount: 1,
      metadata: {
        source,
        confidence,
        domain,
        created: now,
        updated: now
      }
    };

    this.concepts.set(conceptId, concept);
    this.updateConceptIndices(concept);
    
    return conceptId;
  }

  /**
   * Update existing concept
   */
  updateConcept(
    conceptId: string,
    updates: Partial<{
      description: string;
      category: string;
      keywords: string[];
      domain: string;
      confidence: number;
    }>
  ): string {
    const concept = this.concepts.get(conceptId);
    if (!concept) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    // Remove from old indices
    this.removeFromConceptIndices(concept);

    // Apply updates
    if (updates.description) concept.description = updates.description;
    if (updates.category) concept.category = updates.category;
    if (updates.keywords) concept.keywords = updates.keywords.map(k => k.toLowerCase());
    if (updates.domain) concept.metadata.domain = updates.domain;
    if (updates.confidence) concept.metadata.confidence = updates.confidence;
    
    concept.metadata.updated = Date.now();
    concept.importance = this.calculateConceptImportance(
      concept.name,
      concept.description,
      concept.category,
      concept.keywords
    );

    // Update indices
    this.updateConceptIndices(concept);
    
    return conceptId;
  }

  /**
   * Create semantic relation between concepts
   */
  createRelation(
    fromConceptId: string,
    toConceptId: string,
    relationType: SemanticRelation['relationType'],
    strength: number = 0.5,
    bidirectional: boolean = false,
    source: string = 'unknown',
    confidence: number = 0.8
  ): string {
    const fromConcept = this.concepts.get(fromConceptId);
    const toConcept = this.concepts.get(toConceptId);
    
    if (!fromConcept || !toConcept) {
      throw new Error('Both concepts must exist to create relation');
    }

    const relationId = this.generateRelationId(fromConceptId, toConceptId, relationType);
    
    // Check if relation already exists
    if (this.relations.has(relationId)) {
      return relationId;
    }

    // Check capacity
    if (this.relations.size >= this.maxRelations) {
      this.evictWeakestRelations();
    }

    const relation: SemanticRelation = {
      id: relationId,
      fromConcept: fromConceptId,
      toConcept: toConceptId,
      relationType,
      strength: Math.max(0, Math.min(1, strength)),
      bidirectional,
      metadata: {
        source,
        confidence,
        created: Date.now()
      }
    };

    this.relations.set(relationId, relation);
    
    // Update concept relations
    fromConcept.relatedConcepts.push(toConceptId);
    if (bidirectional) {
      toConcept.relatedConcepts.push(fromConceptId);
    }

    // Update relation index
    this.updateRelationIndex(relation);
    
    return relationId;
  }

  /**
   * Retrieve concept by ID
   */
  getConcept(conceptId: string): SemanticConcept | null {
    const concept = this.concepts.get(conceptId);
    if (concept) {
      concept.lastAccessed = Date.now();
      concept.accessCount++;
    }
    return concept || null;
  }

  /**
   * Find concept by name
   */
  findConceptByName(name: string): SemanticConcept | null {
    const conceptId = this.nameIndex.get(name.toLowerCase());
    return conceptId ? this.getConcept(conceptId) : null;
  }

  /**
   * Search concepts by various criteria
   */
  searchConcepts(query: ConceptQuery): SemanticConcept[] {
    let candidateIds: Set<string> = new Set();
    let isFirstFilter = true;

    // Filter by name
    if (query.name) {
      const conceptId = this.nameIndex.get(query.name.toLowerCase());
      if (conceptId) {
        candidateIds = new Set([conceptId]);
        isFirstFilter = false;
      } else {
        return []; // Exact name not found
      }
    }

    // Filter by category
    if (query.category) {
      const categoryIds = this.categoryIndex.get(query.category) || new Set();
      if (isFirstFilter) {
        candidateIds = new Set(categoryIds);
        isFirstFilter = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => categoryIds.has(id)));
      }
    }

    // Filter by keywords
    if (query.keywords && query.keywords.length > 0) {
      const keywordIds = new Set<string>();
      query.keywords.forEach(keyword => {
        const ids = this.keywordIndex.get(keyword.toLowerCase()) || new Set();
        ids.forEach(id => keywordIds.add(id));
      });
      
      if (isFirstFilter) {
        candidateIds = keywordIds;
        isFirstFilter = false;
      } else {
        candidateIds = new Set([...candidateIds].filter(id => keywordIds.has(id)));
      }
    }

    // If no filters applied, use all concepts
    if (isFirstFilter) {
      candidateIds = new Set(this.concepts.keys());
    }

    // Convert to concepts and apply remaining filters
    let concepts = Array.from(candidateIds)
      .map(id => this.concepts.get(id))
      .filter((concept): concept is SemanticConcept => concept !== undefined);

    // Apply additional filters
    concepts = concepts.filter(concept => {
      if (query.minImportance && concept.importance < query.minImportance) {
        return false;
      }
      
      if (query.domain && concept.metadata.domain !== query.domain) {
        return false;
      }
      
      return true;
    });

    // Sort by importance (descending) and access count (descending)
    concepts.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return b.accessCount - a.accessCount;
    });

    // Include related concepts if requested
    if (query.includeRelated) {
      const relatedConcepts = new Set<SemanticConcept>();
      concepts.forEach(concept => {
        concept.relatedConcepts.forEach(relatedId => {
          const related = this.concepts.get(relatedId);
          if (related) {
            relatedConcepts.add(related);
          }
        });
      });
      
      // Merge and deduplicate
      const allConcepts = [...concepts, ...relatedConcepts];
      const uniqueConcepts = Array.from(new Map(allConcepts.map(c => [c.id, c])).values());
      concepts = uniqueConcepts.sort((a, b) => b.importance - a.importance);
    }

    // Apply limit
    if (query.limit) {
      concepts = concepts.slice(0, query.limit);
    }

    return concepts;
  }

  /**
   * Get related concepts
   */
  getRelatedConcepts(
    conceptId: string,
    relationType?: SemanticRelation['relationType'],
    limit?: number
  ): SemanticConcept[] {
    const concept = this.concepts.get(conceptId);
    if (!concept) {
      return [];
    }

    let relations = Array.from(this.relations.values()).filter(
      relation => relation.fromConcept === conceptId || 
                 (relation.bidirectional && relation.toConcept === conceptId)
    );

    if (relationType) {
      relations = relations.filter(relation => relation.relationType === relationType);
    }

    // Sort by strength
    relations.sort((a, b) => b.strength - a.strength);

    if (limit) {
      relations = relations.slice(0, limit);
    }

    const relatedConcepts = relations.map(relation => {
      const relatedId = relation.fromConcept === conceptId ? 
                       relation.toConcept : relation.fromConcept;
      return this.concepts.get(relatedId);
    }).filter((concept): concept is SemanticConcept => concept !== undefined);

    return relatedConcepts;
  }

  /**
   * Process content chunks to extract semantic concepts
   */
  processContentChunks(chunks: ContentChunk[]): string[] {
    const extractedConceptIds: string[] = [];
    
    chunks.forEach(chunk => {
      const concepts = this.extractConceptsFromText(chunk.content);
      concepts.forEach(concept => {
        try {
          const conceptId = this.storeConcept(
            concept.name,
            concept.description,
            concept.category,
            concept.keywords,
            chunk.metadata.domain || 'general',
            chunk.source,
            chunk.score
          );
          extractedConceptIds.push(conceptId);
        } catch (error) {
          console.warn(`Failed to store concept ${concept.name}:`, error);
        }
      });
    });

    return extractedConceptIds;
  }

  /**
   * Get semantic context for query
   */
  getSemanticContext(query: string, intent: QueryIntent, limit: number = 10): SemanticConcept[] {
    const keywords = this.extractKeywords(query);
    const concepts = this.searchConcepts({
      keywords,
      limit: limit * 2, // Get more to filter by intent
      includeRelated: true
    });

    // Filter by intent relevance
    const intentRelevantConcepts = concepts.filter(concept => {
      return this.isConceptRelevantToIntent(concept, intent);
    });

    return intentRelevantConcepts.slice(0, limit);
  }

  /**
   * Get memory statistics
   */
  getStats(): SemanticMemoryStats {
    const concepts = Array.from(this.concepts.values());
    const relations = Array.from(this.relations.values());
    
    // Category counts
    const categoryCounts: Record<string, number> = {};
    concepts.forEach(concept => {
      categoryCounts[concept.category] = (categoryCounts[concept.category] || 0) + 1;
    });

    // Relation type counts
    const relationTypeCounts: Record<string, number> = {};
    relations.forEach(relation => {
      relationTypeCounts[relation.relationType] = (relationTypeCounts[relation.relationType] || 0) + 1;
    });

    // Average importance
    const totalImportance = concepts.reduce((sum, concept) => sum + concept.importance, 0);
    const averageImportance = concepts.length > 0 ? totalImportance / concepts.length : 0;

    // Top concepts
    const topConcepts = concepts
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
      .map(concept => ({
        name: concept.name,
        importance: concept.importance,
        accessCount: concept.accessCount
      }));

    return {
      totalConcepts: concepts.length,
      totalRelations: relations.length,
      categoryCounts,
      relationTypeCounts,
      averageImportance,
      memoryUtilization: (concepts.length / this.maxConcepts) * 100,
      topConcepts
    };
  }

  /**
   * Clear all semantic memory
   */
  clear(): void {
    this.concepts.clear();
    this.relations.clear();
    this.nameIndex.clear();
    this.categoryIndex.clear();
    this.keywordIndex.clear();
    this.relationIndex.clear();
  }

  /**
   * Private helper methods
   */
  private generateConceptId(name: string): string {
    return `concept_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  }

  private generateRelationId(fromId: string, toId: string, type: string): string {
    return `relation_${fromId}_${toId}_${type}`;
  }

  private updateConceptIndices(concept: SemanticConcept): void {
    // Name index
    this.nameIndex.set(concept.name.toLowerCase(), concept.id);

    // Category index
    if (!this.categoryIndex.has(concept.category)) {
      this.categoryIndex.set(concept.category, new Set());
    }
    this.categoryIndex.get(concept.category)!.add(concept.id);

    // Keyword index
    concept.keywords.forEach(keyword => {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(concept.id);
    });
  }

  private removeFromConceptIndices(concept: SemanticConcept): void {
    // Name index
    this.nameIndex.delete(concept.name.toLowerCase());

    // Category index
    this.categoryIndex.get(concept.category)?.delete(concept.id);

    // Keyword index
    concept.keywords.forEach(keyword => {
      this.keywordIndex.get(keyword)?.delete(concept.id);
    });
  }

  private updateRelationIndex(relation: SemanticRelation): void {
    if (!this.relationIndex.has(relation.fromConcept)) {
      this.relationIndex.set(relation.fromConcept, new Set());
    }
    this.relationIndex.get(relation.fromConcept)!.add(relation.id);

    if (relation.bidirectional) {
      if (!this.relationIndex.has(relation.toConcept)) {
        this.relationIndex.set(relation.toConcept, new Set());
      }
      this.relationIndex.get(relation.toConcept)!.add(relation.id);
    }
  }

  private calculateConceptImportance(
    name: string,
    description: string,
    category: string,
    keywords: string[]
  ): number {
    let importance = 0.5; // Base importance

    // Name length (shorter names often more important)
    if (name.length < 20) {
      importance += 0.1;
    }

    // Description quality
    if (description.length > 50) {
      importance += 0.1;
    }

    // Keyword count
    importance += Math.min(0.2, keywords.length * 0.05);

    // Category-based importance
    const importantCategories = ['technology', 'skill', 'concept', 'method'];
    if (importantCategories.includes(category.toLowerCase())) {
      importance += 0.1;
    }

    return Math.max(0, Math.min(1, importance));
  }

  private extractConceptsFromText(text: string): Array<{
    name: string;
    description: string;
    category: string;
    keywords: string[];
  }> {
    const concepts: Array<{
      name: string;
      description: string;
      category: string;
      keywords: string[];
    }> = [];

    // Simple extraction - in real implementation, this would use NLP
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      
      // Look for potential concepts (capitalized words, technical terms)
      const potentialConcepts = words.filter(word => 
        word.length > 3 && 
        (/^[A-Z]/.test(word) || /^[a-z]+ing$/.test(word) || /^[a-z]+tion$/.test(word))
      );

      potentialConcepts.forEach(concept => {
        if (concept.length > 2 && concept.length < 30) {
          concepts.push({
            name: concept,
            description: sentence.trim(),
            category: this.categorizeText(sentence),
            keywords: this.extractKeywords(sentence)
          });
        }
      });
    });

    return concepts;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  private categorizeText(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (/\b(technology|software|programming|code|development|algorithm|framework|library|api|database|system|architecture|design|pattern|method|function|class|object|interface|protocol|standard|specification|tool|platform|service|application|web|mobile|frontend|backend|fullstack|devops|cloud|infrastructure|security|performance|optimization|testing|debugging|deployment|integration|automation|monitoring|analytics|machine learning|artificial intelligence|data science|big data|blockchain|cryptocurrency|iot|ar|vr|ai|ml|dl|nlp|cv|robotics|quantum|cybersecurity|networking|distributed|microservices|containerization|virtualization|serverless|edge computing|5g|6g)\b/.test(lowerText)) {
      return 'technology';
    }
    
    if (/\b(skill|ability|competency|expertise|knowledge|experience|proficiency|capability|talent|strength|qualification|certification|training|education|learning|study|research|analysis|problem solving|critical thinking|creativity|innovation|leadership|management|communication|collaboration|teamwork|project management|time management|organization|planning|strategy|execution|implementation|delivery|quality assurance|testing|debugging|troubleshooting|optimization|performance|efficiency|productivity|methodology|process|workflow|best practice|standard|guideline|principle|concept|theory|model|framework|approach|technique|method|procedure|protocol|algorithm|pattern|architecture|design|development|engineering|construction|building|creation|innovation|invention|discovery|exploration|investigation|experimentation|validation|verification|evaluation|assessment|measurement|metrics|kpi|roi|success|achievement|accomplishment|result|outcome|impact|value|benefit|advantage|improvement|enhancement|upgrade|update|maintenance|support|service|solution|product|feature|functionality|capability|requirement|specification|documentation|manual|guide|tutorial|example|demo|prototype|proof of concept|mvp|pilot|beta|alpha|release|version|iteration|sprint|milestone|deadline|timeline|schedule|plan|roadmap|strategy|vision|mission|goal|objective|target|aim|purpose|intention|motivation|reason|cause|effect|consequence|result|outcome|impact|influence|change|transformation|evolution|progress|advancement|development|growth|expansion|scaling|optimization|improvement|enhancement|upgrade|modernization|migration|transition|adaptation|adjustment|customization|personalization|configuration|setup|installation|deployment|implementation|integration|connection|linking|binding|mapping|translation|conversion|transformation|processing|handling|management|control|governance|compliance|regulation|policy|rule|law|standard|guideline|principle|ethics|responsibility|accountability|transparency|security|privacy|safety|reliability|availability|scalability|performance|efficiency|quality|usability|accessibility|compatibility|interoperability|portability|maintainability|extensibility|flexibility|adaptability|robustness|resilience|fault tolerance|error handling|exception management|logging|monitoring|alerting|notification|reporting|dashboard|analytics|insights|intelligence|knowledge|wisdom|understanding|comprehension|interpretation|analysis|synthesis|evaluation|judgment|decision|choice|selection|option|alternative|solution|answer|response|reaction|action|behavior|conduct|performance|execution|operation|function|activity|task|job|work|effort|labor|service|contribution|participation|involvement|engagement|commitment|dedication|passion|enthusiasm|motivation|inspiration|creativity|innovation|imagination|vision|dream|aspiration|ambition|goal|objective|target|aim|purpose|intention|plan|strategy|approach|method|technique|procedure|process|workflow|system|framework|model|pattern|structure|organization|arrangement|layout|design|architecture|blueprint|schema|specification|requirement|criteria|standard|guideline|principle|rule|policy|regulation|law|compliance|governance|management|control|supervision|oversight|monitoring|tracking|measurement|assessment|evaluation|analysis|review|audit|inspection|examination|investigation|research|study|exploration|discovery|invention|creation|development|construction|building|implementation|execution|operation|function|activity|process|workflow|procedure|routine|practice|custom|tradition|culture|heritage|legacy|history|background|context|environment|setting|situation|circumstance|condition|state|status|phase|stage|step|level|degree|grade|rank|position|place|location|site|spot|point|area|region|zone|territory|domain|field|sector|industry|market|business|company|organization|institution|agency|department|division|team|group|unit|squad|crew|staff|personnel|workforce|employee|worker|professional|specialist|expert|authority|leader|manager|supervisor|director|executive|officer|representative|agent|delegate|ambassador|spokesperson|advocate|champion|supporter|follower|member|participant|contributor|collaborator|partner|ally|friend|colleague|peer|associate|companion|teammate|coworker|client|customer|user|consumer|audience|public|community|society|population|people|individual|person|human|being|entity|object|thing|item|element|component|part|piece|segment|section|chapter|module|unit|block|chunk|fragment|portion|share|percentage|ratio|proportion|rate|frequency|occurrence|instance|example|case|situation|circumstance|condition|state|status|position|location|place|point|spot|area|region|zone|territory|domain|field|sector|industry|market|business|economy|finance|money|currency|capital|investment|funding|budget|cost|price|value|worth|profit|loss|revenue|income|earnings|salary|wage|payment|compensation|reward|bonus|incentive|motivation|encouragement|support|assistance|help|aid|service|benefit|advantage|opportunity|chance|possibility|potential|prospect|future|hope|expectation|anticipation|prediction|forecast|projection|estimate|calculation|measurement|assessment|evaluation|analysis|review|examination|inspection|investigation|research|study|exploration|discovery|invention|creation|development|construction|building|formation|establishment|foundation|basis|ground|root|source|origin|beginning|start|commencement|initiation|launch|introduction|presentation|demonstration|exhibition|display|show|performance|execution|implementation|realization|achievement|accomplishment|success|victory|win|triumph|conquest|defeat|failure|loss|mistake|error|fault|flaw|defect|bug|issue|problem|challenge|difficulty|obstacle|barrier|hindrance|impediment|restriction|limitation|constraint|boundary|limit|threshold|maximum|minimum|range|scope|extent|degree|level|amount|quantity|number|count|total|sum|aggregate|collection|set|group|batch|lot|bundle|package|container|box|case|folder|file|document|record|report|statement|account|description|explanation|instruction|manual|guide|handbook|reference|resource|material|content|information|data|knowledge|wisdom|understanding|insight|awareness|consciousness|perception|recognition|identification|detection|discovery|finding|result|outcome|consequence|effect|impact|influence|change|modification|alteration|adjustment|adaptation|transformation|evolution|development|progress|advancement|improvement|enhancement|upgrade|update|revision|refinement|optimization|tuning|calibration|configuration|setup|installation|deployment|implementation|integration|connection|linking|association|relationship|bond|tie|union|partnership|collaboration|cooperation|teamwork|synergy|harmony|balance|equilibrium|stability|consistency|reliability|dependability|trustworthiness|credibility|authenticity|validity|accuracy|precision|correctness|quality|excellence|superiority|advantage|benefit|value|worth|importance|significance|relevance|meaning|purpose|function|role|use|application|utilization|employment|deployment|implementation|execution|operation|performance|behavior|conduct|action|activity|movement|motion|change|transition|shift|transformation|evolution|development|growth|expansion|extension|enlargement|increase|increment|addition|supplement|complement|enhancement|improvement|upgrade|update|revision|modification|alteration|change|transformation|transition|shift|movement|motion|action|activity|behavior|conduct|performance|execution|operation|function|process|procedure|method|technique|approach|strategy|plan|design|blueprint|model|pattern|template|framework|structure|system|organization|arrangement|layout|configuration|setup|installation|deployment|implementation|integration|connection|linking|association|relationship|bond|tie|union|partnership|collaboration|cooperation|teamwork|synergy|harmony|balance|equilibrium|stability|consistency|reliability|dependability|trustworthiness|credibility|authenticity|validity|accuracy|precision|correctness|quality|excellence|superiority|advantage|benefit|value|worth|importance|significance|relevance|meaning|purpose|function|role|use|application|utilization|employment|deployment|implementation|execution|operation|performance|behavior|conduct|action|activity|movement|motion|change|transition|shift|transformation|evolution|development|growth|expansion|extension|enlargement|increase|increment|addition|supplement|complement|enhancement|improvement|upgrade|update|revision|modification|alteration|adjustment|adaptation|customization|personalization|individualization|specialization|differentiation|distinction|uniqueness|originality|creativity|innovation|invention|discovery|exploration|investigation|research|study|analysis|examination|inspection|review|assessment|evaluation|measurement|quantification|calculation|computation|processing|handling|management|administration|governance|control|regulation|supervision|oversight|monitoring|tracking|observation|surveillance|inspection|audit|review|check|test|trial|experiment|pilot|prototype|model|simulation|emulation|imitation|replication|reproduction|duplication|copy|clone|version|variant|alternative|option|choice|selection|decision|judgment|evaluation|assessment|analysis|interpretation|understanding|comprehension|knowledge|awareness|consciousness|perception|recognition|realization|acknowledgment|acceptance|approval|endorsement|support|backing|assistance|help|aid|service|contribution|participation|involvement|engagement|commitment|dedication|devotion|loyalty|faithfulness|reliability|dependability|trustworthiness|credibility|integrity|honesty|transparency|openness|clarity|precision|accuracy|correctness|quality|excellence|perfection|mastery|expertise|skill|ability|competence|proficiency|capability|capacity|potential|talent|gift|strength|power|force|energy|vitality|vigor|enthusiasm|passion|motivation|inspiration|drive|ambition|determination|persistence|perseverance|resilience|endurance|stamina|patience|tolerance|acceptance|understanding|empathy|compassion|kindness|generosity|charity|altruism|selflessness|service|contribution|value|worth|importance|significance|meaning|purpose|function|role|responsibility|duty|obligation|commitment|promise|agreement|contract|deal|arrangement|understanding|consensus|harmony|peace|tranquility|calm|serenity|balance|equilibrium|stability|consistency|reliability|predictability|certainty|confidence|assurance|security|safety|protection|defense|shield|barrier|wall|fence|boundary|limit|threshold|standard|benchmark|criteria|requirement|specification|guideline|principle|rule|law|regulation|policy|procedure|protocol|method|technique|approach|strategy|plan|design|blueprint|model|pattern|template|framework|structure|system|organization|arrangement|layout|configuration|setup|installation|deployment|implementation|execution|operation|function|activity|process|workflow|procedure|routine|habit|practice|custom|tradition|culture|heritage|legacy|history|past|present|future|time|moment|instant|second|minute|hour|day|week|month|year|decade|century|millennium|era|age|period|phase|stage|step|level|degree|grade|rank|position|place|location|site|spot|point|area|region|zone|territory|domain|field|sector|industry|market|business|economy|finance|money|currency|capital|investment|funding|budget|cost|price|value|worth|profit|revenue|income|earnings|salary|wage|payment|compensation|reward|bonus|incentive|motivation|encouragement|support|assistance|help|aid|service|benefit|advantage|opportunity|chance|possibility|potential|prospect|future|hope|expectation|anticipation|prediction|forecast|projection|estimate|calculation|measurement|assessment|evaluation|analysis|review|examination|inspection|investigation|research|study|exploration|discovery|invention|creation|development|construction|building|formation|establishment|foundation|basis|ground|root|source|origin|beginning|start|commencement|initiation|launch|introduction|presentation|demonstration|exhibition|display|show|performance|execution|implementation|realization|achievement|accomplishment|success|victory|triumph|conquest|win)\b/.test(lowerText)) {
      return 'skill';
    }
    
    if (/\b(project|work|experience|role|position|job|task|assignment|responsibility|achievement|accomplishment|success|result|outcome|deliverable|milestone|goal|objective|target|requirement|specification|solution|implementation|development|creation|design|architecture|system|application|software|platform|service|product|feature|functionality|capability|tool|framework|library|api|database|integration|deployment|testing|quality assurance|performance|optimization|maintenance|support|documentation|training|collaboration|teamwork|leadership|management|coordination|planning|strategy|execution|delivery|client|customer|user|stakeholder|business|organization|company|industry|market|domain|field|sector|technology|methodology|process|workflow|best practice|standard|guideline|principle|approach|technique|method|procedure|protocol|algorithm|pattern|model|framework|structure|architecture|design|blueprint|template|specification|requirement|criteria|benchmark|metric|kpi|measurement|assessment|evaluation|analysis|review|audit|inspection|examination|investigation|research|study|exploration|discovery|innovation|invention|creation|development|construction|building|implementation|execution|operation|function|activity|process|workflow|procedure|routine|practice|custom|tradition|culture|heritage|legacy|history|background|context|environment|setting|situation|circumstance|condition|state|status|phase|stage|step|level|degree|grade|rank|position|place|location|site|spot|point|area|region|zone|territory|domain|field|sector|industry|market|business|economy|finance|budget|cost|price|value|worth|profit|revenue|income|earnings|salary|wage|payment|compensation|reward|bonus|incentive|motivation|encouragement|support|assistance|help|aid|service|benefit|advantage|opportunity|chance|possibility|potential|prospect|future|hope|expectation|anticipation|prediction|forecast|projection|estimate|calculation|measurement|assessment|evaluation|analysis|review|examination|inspection|investigation|research|study|exploration|discovery|invention|creation|development|construction|building|formation|establishment|foundation|basis|ground|root|source|origin|beginning|start|commencement|initiation|launch|introduction|presentation|demonstration|exhibition|display|show|performance|execution|implementation|realization|achievement|accomplishment|success|victory|triumph|conquest|win)\b/.test(lowerText)) {
      return 'experience';
    }
    
    if (/\b(concept|idea|theory|principle|model|framework|paradigm|approach|methodology|philosophy|doctrine|belief|understanding|knowledge|wisdom|insight|awareness|consciousness|perception|recognition|realization|comprehension|interpretation|meaning|significance|importance|relevance|value|worth|purpose|function|role|responsibility|duty|obligation|commitment|promise|agreement|contract|deal|arrangement|understanding|consensus|harmony|peace|balance|equilibrium|stability|consistency|reliability|predictability|certainty|confidence|assurance|security|safety|protection|defense|standard|benchmark|criteria|requirement|specification|guideline|rule|law|regulation|policy|procedure|protocol|method|technique|strategy|plan|design|blueprint|pattern|template|structure|system|organization|arrangement|layout|configuration|setup|installation|deployment|implementation|execution|operation|function|activity|process|workflow|procedure|routine|habit|practice|custom|tradition|culture|heritage|legacy|history|background|context|environment|setting|situation|circumstance|condition|state|status|phase|stage|step|level|degree|grade|rank|position|place|location|site|spot|point|area|region|zone|territory|domain|field|sector|industry|market|business|economy|finance|budget|cost|price|value|worth|profit|revenue|income|earnings|salary|wage|payment|compensation|reward|bonus|incentive|motivation|encouragement|support|assistance|help|aid|service|benefit|advantage|opportunity|chance|possibility|potential|prospect|future|hope|expectation|anticipation|prediction|forecast|projection|estimate|calculation|measurement|assessment|evaluation|analysis|review|examination|inspection|investigation|research|study|exploration|discovery|invention|creation|development|construction|building|formation|establishment|foundation|basis|ground|root|source|origin|beginning|start|commencement|initiation|launch|introduction|presentation|demonstration|exhibition|display|show|performance|execution|implementation|realization|achievement|accomplishment|success|victory|triumph|conquest|win)\b/.test(lowerText)) {
      return 'concept';
    }
    
    return 'general';
  }

  private isConceptRelevantToIntent(concept: SemanticConcept, intent: QueryIntent): boolean {
    switch (intent) {
      case 'SYNTHESIS':
        return concept.category === 'skill' || concept.category === 'technology' || concept.category === 'concept';
      case 'EXPLORATION':
        return concept.category === 'experience' || concept.category === 'concept';
      case 'COMPARISON':
        return concept.category === 'technology' || concept.category === 'skill';
      case 'FACTUAL':
        return concept.category === 'technology' || concept.category === 'experience';
      case 'CASUAL':
        return concept.category === 'general' || concept.category === 'experience';
      default:
        return true;
    }
  }

  private evictLeastImportantConcepts(): void {
    const concepts = Array.from(this.concepts.values());
    concepts.sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance;
      }
      return a.lastAccessed - b.lastAccessed;
    });

    // Remove least important 10%
    const toRemove = Math.max(1, Math.floor(concepts.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      const concept = concepts[i];
      this.concepts.delete(concept.id);
      this.removeFromConceptIndices(concept);
    }
  }

  private evictWeakestRelations(): void {
    const relations = Array.from(this.relations.values());
    relations.sort((a, b) => {
      if (a.strength !== b.strength) {
        return a.strength - b.strength;
      }
      return a.metadata.created - b.metadata.created;
    });

    // Remove weakest 10%
    const toRemove = Math.max(1, Math.floor(relations.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      const relation = relations[i];
      this.relations.delete(relation.id);
      
      // Remove from concept relations
      const fromConcept = this.concepts.get(relation.fromConcept);
      const toConcept = this.concepts.get(relation.toConcept);
      
      if (fromConcept) {
        fromConcept.relatedConcepts = fromConcept.relatedConcepts.filter(id => id !== relation.toConcept);
      }
      
      if (toConcept && relation.bidirectional) {
        toConcept.relatedConcepts = toConcept.relatedConcepts.filter(id => id !== relation.fromConcept);
      }
    }
  }
}