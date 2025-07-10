import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { unifiedIntelligentChat } from '../../lib/unified-intelligent-chat';

// Build version info for tracking - implementacja wersjonowania z timestampem
const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';
const BUILD_DATE = new Date().toISOString();
const PIPELINE_VERSION = '1.0.0-full-context-management';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  includeMetadata?: boolean;
}

interface ChatResponse {
  response: string;
  confidence: number;
  processingTime: number;
  metadata: {
    version: string;
    buildDate: string;
    pipelineVersion: string;
    queryIntent: string;
    contextUtilization: number;
    processingSteps: string[];
    sources: string[];
    totalTokens: number;
    compressionRate: number;
    cacheHit: boolean;
    errorHandled?: boolean;
  };
  performance: {
    retrievalTime: number;
    compressionTime: number;
    cacheTime: number;
    generationTime: number;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, maxTokens = 1000, temperature = 0.7, includeMetadata = true }: ChatRequest = req.body;

    if (!messages || messages.length === 0) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const userQuery = messages[messages.length - 1].content;
    
    if (!userQuery || userQuery.trim() === '') {
      res.status(400).json({ error: 'User query cannot be empty' });
      return;
    }

    // Use the unified intelligent chat pipeline
    const pipelineResponse = await unifiedIntelligentChat.processQuery({
      userQuery
    });

    // Format response for backwards compatibility
    const response: ChatResponse = {
      response: pipelineResponse.response,
      confidence: pipelineResponse.confidence,
      processingTime: pipelineResponse.processingTime,
      metadata: {
        version: BUILD_VERSION,
        buildDate: BUILD_DATE,
        pipelineVersion: PIPELINE_VERSION,
        queryIntent: pipelineResponse.metadata.queryIntent,
        contextUtilization: pipelineResponse.metadata.contextSize / maxTokens,
        processingSteps: pipelineResponse.metadata.processingSteps,
        sources: pipelineResponse.metadata.sources,
        totalTokens: pipelineResponse.metadata.totalTokens,
        compressionRate: pipelineResponse.metadata.compressionRate,
        cacheHit: pipelineResponse.metadata.cacheHit
      },
      performance: {
        retrievalTime: pipelineResponse.performance.retrievalTime,
        compressionTime: pipelineResponse.performance.compressionTime,
        cacheTime: pipelineResponse.performance.cacheTime,
        generationTime: pipelineResponse.performance.generationTime
      }
    };

    // Add conversation memory for context continuity
    if (messages.length > 1) {
      // Store conversation context for future queries
      await unifiedIntelligentChat.warmupCache([userQuery]);
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    // Graceful degradation - fallback response
    const fallbackResponse: ChatResponse = {
      response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment. If the problem persists, you can reach out to me directly.",
      confidence: 0.1,
      processingTime: Date.now(),
      metadata: {
        version: BUILD_VERSION,
        buildDate: BUILD_DATE,
        pipelineVersion: PIPELINE_VERSION,
        queryIntent: 'ERROR',
        contextUtilization: 0,
        processingSteps: ['error-handling'],
        sources: [],
        totalTokens: 0,
        compressionRate: 0,
        cacheHit: false,
        errorHandled: true
      },
      performance: {
        retrievalTime: 0,
        compressionTime: 0,
        cacheTime: 0,
        generationTime: 0
      }
    };

    res.status(500).json(fallbackResponse);
  }
}