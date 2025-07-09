import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { 
  buildDynamicSystemPrompt, 
  getEnhancedContext, 
  analyzeQueryIntent, 
  postProcessResponse 
} from '../../lib/chat-intelligence';
import { conversationMemory, getConversationContext } from '../../lib/conversation-memory';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Performance tracking
let requestCount = 0;
let totalResponseTime = 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  requestCount++;
  
  console.log('[INTELLIGENT-CHAT] Request received');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const userMessage = messages[messages.length - 1];
    if (!userMessage?.content) {
      return res.status(400).json({ error: 'No message content' });
    }
    
    const userQuery = userMessage.content;
    const queryIntent = analyzeQueryIntent(userQuery);
    
    console.log('[INTELLIGENT-CHAT] Processing query:', {
      query: userQuery.substring(0, 100),
      intent: queryIntent,
      sessionId
    });
    
    // 1. Get conversation context and history
    const conversationContext = sessionId 
      ? getConversationContext(sessionId, userQuery)
      : { relevantHistory: [], contextText: '', sessionSummary: null };
    
    // 2. Get enhanced context from vector database
    const vectorContext = await getEnhancedContext(userQuery, {
      conversationHistory: conversationContext.relevantHistory,
      queryExpansion: true,
      diversityBoost: queryIntent === 'SYNTHESIS',
      maxResults: getMaxResultsForIntent(queryIntent)
    });
    
    // 3. Combine contexts
    const fullContext = combineContexts(vectorContext, conversationContext.contextText);
    
    // 4. Build dynamic system prompt
    const systemPrompt = buildDynamicSystemPrompt(userQuery, fullContext);
    
    // 5. Prepare messages for OpenAI
    const openaiMessages = buildOpenAIMessages(
      systemPrompt, 
      userQuery, 
      conversationContext.relevantHistory
    );
    
    console.log('[INTELLIGENT-CHAT] Context prepared:', {
      vectorContextLength: vectorContext.length,
      conversationContextLength: conversationContext.contextText.length,
      totalContextLength: fullContext.length,
      historyMessages: conversationContext.relevantHistory.length
    });
    
    // 6. Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: getTemperatureForIntent(queryIntent),
      max_tokens: getMaxTokensForIntent(queryIntent),
      presence_penalty: 0.1, // Encourage variety
      frequency_penalty: 0.1, // Reduce repetition
      top_p: 0.9
    });
    
    const responseText = completion.choices[0]?.message?.content || '';
    
    if (!responseText) {
      throw new Error('No response generated from OpenAI');
    }
    
    // 7. Post-process the response
    const finalResponse = await postProcessResponse(responseText, userQuery);
    
    // 8. Store conversation in memory
    const responseTime = Date.now() - startTime;
    totalResponseTime += responseTime;
    
    if (sessionId) {
      // Add user message to memory
      conversationMemory.addMessage(sessionId, {
        role: 'user',
        content: userQuery,
        metadata: {
          queryIntent,
          contextLength: fullContext.length,
          responseTime
        }
      });
      
      // Add assistant response to memory
      conversationMemory.addMessage(sessionId, {
        role: 'assistant',
        content: finalResponse,
        metadata: {
          queryIntent,
          contextLength: fullContext.length,
          responseTime
        }
      });
    }
    
    // 9. Log performance metrics
    console.log('[INTELLIGENT-CHAT] Request completed:', {
      responseTime: `${responseTime}ms`,
      averageResponseTime: `${(totalResponseTime / requestCount).toFixed(2)}ms`,
      responseLength: finalResponse.length,
      tokensUsed: completion.usage?.total_tokens || 0,
      queryIntent,
      sessionId
    });
    
    // 10. Return response
    return res.status(200).json({
      content: finalResponse,
      metadata: {
        queryIntent,
        contextLength: fullContext.length,
        responseTime,
        tokensUsed: completion.usage?.total_tokens || 0,
        sessionId,
        conversationLength: conversationContext.relevantHistory.length
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('[INTELLIGENT-CHAT] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return graceful error response
    const isPolish = req.body?.messages?.some((msg: any) => 
      /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(msg.content)
    );
    
    const errorMessage = isPolish 
      ? 'Przepraszam, wystąpił błąd podczas przetwarzania Twojego pytania. Spróbuj ponownie za chwilę.'
      : 'Sorry, there was an error processing your question. Please try again in a moment.';
    
    return res.status(500).json({
      content: errorMessage,
      error: 'Internal server error',
      metadata: {
        responseTime,
        failed: true
      }
    });
  }
}

// Helper Functions

function getMaxResultsForIntent(intent: string): number {
  switch (intent) {
    case 'SYNTHESIS': return 20; // More results for comprehensive analysis
    case 'EXPLORATION': return 15; // Good variety for storytelling
    case 'COMPARISON': return 12; // Multiple examples for comparison
    case 'SPECIFIC': return 8; // Focused results
    default: return 10; // Standard amount
  }
}

function getTemperatureForIntent(intent: string): number {
  switch (intent) {
    case 'SYNTHESIS': return 0.7; // Creative synthesis
    case 'EXPLORATION': return 0.8; // Engaging storytelling
    case 'COMPARISON': return 0.6; // Balanced analysis
    case 'SPECIFIC': return 0.4; // Precise information
    default: return 0.7; // Natural conversation
  }
}

function getMaxTokensForIntent(intent: string): number {
  switch (intent) {
    case 'SYNTHESIS': return 1200; // Longer responses for analysis
    case 'EXPLORATION': return 1000; // Detailed explanations
    case 'COMPARISON': return 800; // Structured comparisons
    case 'SPECIFIC': return 400; // Concise answers
    default: return 800; // Standard length
  }
}

function combineContexts(vectorContext: string, conversationContext: string): string {
  let combined = '';
  
  if (vectorContext) {
    combined += vectorContext;
  }
  
  if (conversationContext) {
    if (combined) combined += '\n\n';
    combined += conversationContext;
  }
  
  return combined;
}

function buildOpenAIMessages(
  systemPrompt: string, 
  userQuery: string, 
  conversationHistory: any[]
): any[] {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add relevant conversation history (last 3 exchanges max)
  const recentHistory = conversationHistory.slice(-6); // Last 3 user+assistant pairs
  recentHistory.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });
  
  // Add current user message
  messages.push({
    role: 'user',
    content: userQuery
  });
  
  return messages;
}

// Export performance metrics for monitoring
export function getPerformanceMetrics() {
  return {
    requestCount,
    averageResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
    totalResponseTime,
    conversationMetrics: conversationMemory.getPerformanceMetrics()
  };
}