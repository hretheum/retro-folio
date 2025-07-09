import { integrationOrchestrator } from './integration-orchestrator';
import type { SearchResult } from './vector-store';

export interface ChatContextResult {
  context: string;
  searchResults: any[];
  confidence: number;
  performanceMetrics: {
    totalTime: number;
    stages: string[];
    cacheHit: boolean;
  };
}

/**
 * Adapter to use the full context management system in chat endpoints
 */
export class ChatContextAdapter {
  
  /**
   * Process a query through the full context management pipeline
   */
  async getContext(query: string, options: {
    sessionId?: string;
    maxTokens?: number;
    namespace?: string;
  } = {}): Promise<ChatContextResult> {
    
    console.log('[CHAT-CONTEXT-ADAPTER] Processing query:', query);
    const startTime = Date.now();
    
    try {
      // Execute the full intelligent pipeline
      const pipelineResult = await integrationOrchestrator.executeIntelligentPipeline(query);
      
      console.log('[CHAT-CONTEXT-ADAPTER] Pipeline completed:', {
        stages: pipelineResult.stages,
        confidence: pipelineResult.confidence,
        processingTime: pipelineResult.processingTime
      });
      
      // Extract search results from pipeline stages
      let searchResults: any[] = [];
      let contextChunks: string[] = [];
      
      // Parse the response to extract actual content
      const responseContent = pipelineResult.response || '';
      
      // Try to extract search results from the pipeline metadata
      if (pipelineResult.metadata && typeof pipelineResult.metadata === 'object') {
        const metadata = pipelineResult.metadata as any;
        
        // Look for pruned chunks or results in metadata
        if (metadata.prunedChunks && metadata.prunedChunks.length > 0) {
          searchResults = metadata.prunedChunks;
          console.log('[CHAT-CONTEXT-ADAPTER] Using pruned chunks:', metadata.prunedChunks.length);
        } else if (metadata.searchResults && metadata.searchResults.length > 0) {
          searchResults = metadata.searchResults;
          console.log('[CHAT-CONTEXT-ADAPTER] Using search results:', metadata.searchResults.length);
        }
      }
      
      // If we have response content but no structured results, parse it
      if (searchResults.length === 0 && responseContent) {
        // The response content is already the concatenated context
        return {
          context: responseContent,
          searchResults: [{
            chunk: {
              text: responseContent,
              metadata: { source: 'pipeline-generated' }
            },
            score: pipelineResult.confidence
          }],
          confidence: pipelineResult.confidence,
          performanceMetrics: {
            totalTime: Date.now() - startTime,
            stages: pipelineResult.stages,
            cacheHit: pipelineResult.fallbacksUsed.includes('smart-caching')
          }
        };
      }
      
      // Build context from search results - no need since response already has it
      // Just return the response content which is already properly formatted
      return {
        context: responseContent, // This already contains the formatted context
        searchResults,
        confidence: pipelineResult.confidence,
        performanceMetrics: {
          totalTime: Date.now() - startTime,
          stages: pipelineResult.stages,
          cacheHit: pipelineResult.fallbacksUsed.includes('smart-caching')
        }
      };
      
    } catch (error) {
      console.error('[CHAT-CONTEXT-ADAPTER] Pipeline failed:', error);
      
      // Fallback to basic search
      return this.fallbackToBasicSearch(query, options);
    }
  }
  
  /**
   * Fallback to basic hybrid search if pipeline fails
   */
  private async fallbackToBasicSearch(query: string, options: any): Promise<ChatContextResult> {
    console.warn('[CHAT-CONTEXT-ADAPTER] Using fallback basic search');
    
    // Import dynamically to avoid circular dependency
    const { hybridSearchPinecone } = await import('./pinecone-vector-store');
    
    const searchResults = await hybridSearchPinecone(query, {
      topK: 30,
      namespace: options.namespace || 'production',
      vectorWeight: 0.7
    });
    
    const contextChunks = searchResults.map(r => r.chunk.text);
    const context = contextChunks.join('\n\n---\n\n');
    
    return {
      context,
      searchResults,
      confidence: 0.7,
      performanceMetrics: {
        totalTime: Date.now(),
        stages: ['fallback-search'],
        cacheHit: false
      }
    };
  }
}

// Export singleton instance
export const chatContextAdapter = new ChatContextAdapter();