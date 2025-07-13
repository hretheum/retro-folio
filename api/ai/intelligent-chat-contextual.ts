import { NextApiRequest, NextApiResponse } from 'next';
import { ContextIntegration } from '../../lib/context/context-integration';
import { createRateLimitMiddleware, RATE_LIMITS } from '../../lib/rate-limiting/rate-limiter';

// Initialize context integration
const contextIntegration = new ContextIntegration();
let isInitialized = false;

// Rate limiting middleware
const rateLimitMiddleware = createRateLimitMiddleware('contextual-chat', RATE_LIMITS.CHAT_API);

interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: {
    previousMessages?: string[];
    userPreferences?: Record<string, any>;
    metadata?: any;
  };
}

interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    intent: {
      classified: string;
      confidence: number;
      hierarchy: {
        path: string[];
        levels: any;
      };
    };
    context: {
      usedMemories: any[];
      memoryScore: number;
      conversationFlow: string[];
      sessionContext: any;
    };
    metadata: {
      processingTime: number;
      memoryOperations: number;
      conversationTurn: number;
      timestamp: string;
    };
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  // Apply rate limiting
  await new Promise<void>((resolve, reject) => {
    rateLimitMiddleware(req as any, res as any, (error?: any) => {
      if (error) reject(error);
      else resolve();
    });
  });

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Initialize context integration if needed
    if (!isInitialized) {
      await contextIntegration.initialize();
      isInitialized = true;
    }

    const { message, sessionId, userId, context }: ChatRequest = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Generate session ID if not provided
    const actualSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process the contextual message
    const result = await contextIntegration.processContextualMessage({
      message: message.trim(),
      sessionId: actualSessionId,
      userId,
      metadata: {
        timestamp: new Date(),
        source: 'api_endpoint',
        context: context || {}
      }
    });

    // Return successful response
    res.status(200).json({
      success: true,
      data: {
        response: result.response,
        intent: result.intent,
        context: result.context,
        metadata: {
          ...result.metadata,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in contextual chat endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

// Health check endpoint
export async function healthCheck(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!isInitialized) {
      await contextIntegration.initialize();
      isInitialized = true;
    }

    const systemStats = contextIntegration.getSystemStats();
    const validation = await contextIntegration.validateSystem();

    res.status(200).json({
      success: true,
      status: validation.valid ? 'healthy' : 'degraded',
      data: {
        systemStats,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          performance: validation.performance
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Session management endpoints
export async function getSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const sessionStats = await contextIntegration.getSessionStats(sessionId);
    
    res.status(200).json({
      success: true,
      data: sessionStats
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session data'
    });
  }
}

export async function clearSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    await contextIntegration.clearSession(sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Session cleared successfully'
    });

  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear session'
    });
  }
}

export async function getConversationInsights(req: NextApiRequest, res: NextApiResponse) {
  try {
    const insights = await contextIntegration.getConversationInsights();
    
    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation insights'
    });
  }
}

// Memory management endpoints
export async function addMemory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { content, type, metadata } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({
        success: false,
        error: 'Content and type are required'
      });
    }

    const memoryId = await contextIntegration.addContextualMemory(content, type, metadata || {});
    
    res.status(200).json({
      success: true,
      data: { memoryId }
    });

  } catch (error) {
    console.error('Add memory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add memory'
    });
  }
}

export async function consolidateMemories(req: NextApiRequest, res: NextApiResponse) {
  try {
    await contextIntegration.consolidateMemories();
    
    res.status(200).json({
      success: true,
      message: 'Memory consolidation completed'
    });

  } catch (error) {
    console.error('Consolidate memories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to consolidate memories'
    });
  }
}

// Batch processing endpoint
export async function batchProcess(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { messages, sessionId, userId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    const results = [];
    const actualSessionId = sessionId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    for (const message of messages) {
      try {
        const result = await contextIntegration.processContextualMessage({
          message: message.trim(),
          sessionId: actualSessionId,
          userId,
          metadata: {
            timestamp: new Date(),
            source: 'batch_processing',
            context: {}
          }
        });
        
        results.push({
          success: true,
          message,
          result: {
            response: result.response,
            intent: result.intent.classified,
            confidence: result.intent.confidence,
            processingTime: result.metadata.processingTime
          }
        });
      } catch (error) {
        results.push({
          success: false,
          message,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: actualSessionId,
        results,
        totalProcessed: results.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Batch process error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch processing failed'
    });
  }
}

// Export configuration for Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};