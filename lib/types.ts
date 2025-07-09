// Enhanced Type Definitions for Intelligent Context Management System

// Base metadata interface
export interface BaseMetadata {
  source?: string;
  type?: string;
  timestamp?: number;
  quality?: number;
  authority?: string;
  freshness?: number;
  domain?: string;
  language?: string;
  [key: string]: unknown;
}

// Content chunk with proper typing
export interface ContentChunk {
  content: string;
  metadata: BaseMetadata;
  score: number;
  source: string;
  id?: string;
  embedding?: number[];
}

// Search result interface
export interface SearchResult {
  content: string;
  score: number;
  confidence: number;
  source: string;
  metadata: BaseMetadata;
  id?: string;
}

// Conversation history interface
export interface ConversationEntry {
  userMessage: string;
  botResponse: string;
  timestamp: number;
  metadata?: BaseMetadata;
}

// Processing details for logging
export interface ProcessingDetails {
  stage: string;
  duration: number;
  inputSize: number;
  outputSize: number;
  success: boolean;
  errors?: string[];
  metadata?: BaseMetadata;
}

// Session summary interface
export interface SessionSummary {
  sessionId: string;
  messageCount: number;
  averageResponseTime: number;
  successRate: number;
  topTopics: string[];
  lastActivity: number;
  metadata: BaseMetadata;
}

// Theme-based result grouping
export interface ThemeGroup {
  theme: string;
  results: SearchResult[];
  relevanceScore: number;
  count: number;
}

// Analytics client interface
export interface AnalyticsClient {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(name?: string, properties?: Record<string, unknown>): void;
  flush(): Promise<void>;
}

// Test query interface
export interface TestQuery {
  query: string;
  expectedType: string;
  complexity: number;
  expectedTokens?: number;
  metadata?: BaseMetadata;
}

// Pinecone match interface
export interface PineconeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: BaseMetadata;
}

// Vector store response
export interface VectorStoreResponse {
  matches: PineconeMatch[];
  namespace?: string;
}

// Enhanced content extraction result
export interface ExtractedContent {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    date?: string;
    source?: string;
    type?: string;
    length?: number;
    language?: string;
    quality?: number;
    [key: string]: unknown;
  };
  chunks: ContentChunk[];
}

// Query expansion result
export interface QueryExpansion {
  original: string;
  expanded: string[];
  synonyms: string[];
  relatedTerms: string[];
  confidence: number;
}

// Context formatting result
export interface FormattedContext {
  content: string;
  metadata: {
    totalChunks: number;
    totalTokens: number;
    themes: string[];
    sources: string[];
    confidence: number;
  };
}

// Context size result interface for robust query processing
export interface ContextSizeResult {
  optimalSize: number;
  confidence: number;
  processingTime: number;
  factors?: {
    complexity: number;
    domain: string;
    queryType: string;
    memoryConstraint: number;
    historicalPerformance: number;
  };
  reasoning?: string;
  metadata?: BaseMetadata;
}