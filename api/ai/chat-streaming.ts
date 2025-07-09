import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatContextAdapter } from '../../lib/chat-context-adapter';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build version info
// @ts-ignore
const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';

// Performance metrics (kept for backwards compatibility)
let totalRequests = 0;
let cacheHits = 0;
let totalResponseTime = 0;

const SYSTEM_PROMPT = `You are Eryk AI, representing Eryk Orłowski. 

CRITICAL FORMATTING RULES:

1. Parse the context to identify distinct projects/companies
2. Extract: Company name, Role, and Key achievements
3. Format EACH project as a separate block like this:

**[Projekt: Company Name - Role]**
• First achievement (keep it concise)
• Second achievement (with impact/numbers)
• Third achievement (what you built/improved)
• Fourth achievement (results/metrics)
<button-prompt="Company Name">Opowiedz mi więcej →</button-prompt>

4. NEVER merge multiple projects into one block
5. NEVER put raw text outside of formatted blocks
6. Each bullet point should be ONE line, not a paragraph
7. If context mentions multiple companies (e.g., Revolut, Volkswagen, Spotify), create SEPARATE blocks for each

SPECIAL HANDLING:
- If the user's question is nonsensical (like "lorem ipsum", random text, or unrelated to portfolio/experience), respond politely:
  - Polish: "Przepraszam, nie zrozumiałem pytania. Może zapytaj o moje projekty, doświadczenie lub konkretne firmy?"
  - English: "Sorry, I didn't understand your question. Try asking about my projects, experience, or specific companies?"
- If context is empty or irrelevant to the question, acknowledge this instead of inventing projects

SKILLS AND COMPETENCIES:
- When asked about skills ("umiejętności", "skills", "co umiesz", "what can you do"), scan the ENTIRE context for:
  - Technical skills mentioned in any project
  - Soft skills and leadership abilities
  - Design and UX capabilities
  - Business and strategic skills
  - Tools and technologies used
- Create a comprehensive skills overview from ALL projects found in context

Language: Use Polish if user writes in Polish, English otherwise.
Personality: Be direct, honest, no corporate bullshit.
Response style: Stream naturally, don't wait for complete thoughts.

IMPORTANT DISCLAIMER:
Always end your response with an appropriate disclaimer in the same language as the user's question:
- English: "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience."
- Polish: "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  totalRequests++;
  
  // Generate build date for this request
  const BUILD_DATE = new Date().toISOString().split('T')[0];
  
  console.log('[CHAT-STREAMING] Endpoint called');
  console.log('[BUILD_INFO] Current build:', BUILD_VERSION, BUILD_DATE);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId } = req.body;
    console.log('[CHAT-STREAMING] Messages:', messages?.length);
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return res.status(400).json({ error: 'No message content' });
    }

    // Set up Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Search for relevant context using the full context management system
    let context = '';
    let cacheHit = false;
    let searchResults: any[] = [];
    let confidence = 0;
    
    try {
      const searchQuery = lastMessage.content;
      
      console.log('[CHAT-STREAMING] Original query:', searchQuery);
      
      // Use the full context management pipeline
      const contextResult = await chatContextAdapter.getContext(searchQuery, {
        sessionId,
        maxTokens: 4000,
        namespace: 'production'
      });
      
      context = contextResult.context;
      searchResults = contextResult.searchResults;
      confidence = contextResult.confidence;
      cacheHit = contextResult.performanceMetrics.cacheHit;
      
      console.log('[CHAT-STREAMING] Context management completed:', {
        contextLength: context.length,
        searchResultsCount: searchResults.length,
        confidence,
        stages: contextResult.performanceMetrics.stages,
        totalTime: contextResult.performanceMetrics.totalTime
      });
      
      // Log first few results for debugging
      searchResults.slice(0, 3).forEach((result, index) => {
        const text = result.chunk?.text || result.content || result.text || '';
        console.log(`[CHAT-STREAMING] Result ${index + 1}:`);
        console.log(`[CHAT-STREAMING] Text preview: ${text.substring(0, 150)}...`);
      });
      
    } catch (searchError) {
      console.error('[CHAT-STREAMING] Context management error:', searchError);
      // Continue with empty context
    }
    
    // Build messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: `Here is raw context from my experience database. Parse it and format according to the rules:

CONTEXT:
${context || 'NO CONTEXT FOUND - The search returned no relevant results'}

USER QUESTION: ${lastMessage.content}

IMPORTANT INSTRUCTIONS:
1. If the question seems nonsensical or unrelated to portfolio/experience, respond politely as instructed
2. If context is empty or irrelevant, acknowledge this instead of inventing information
3. For skills questions, extract ALL skills from ENTIRE context, not just one project
4. ALWAYS create SEPARATE blocks for EACH company found in context
5. Stream your response naturally - don't wait for complete thoughts
6. Use the button-prompt format for interactive elements
7. DO NOT add build version info - it will be added automatically` }
    ];
    
    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    });
    
    console.log('[CHAT-STREAMING] Starting stream');
    
    let responseText = '';
    let tokenCount = 0;
    
    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        responseText += content;
        tokenCount++;
        
        // Write chunk to response
        res.write(content);
        
        // Log progress every 10 tokens
        if (tokenCount % 10 === 0) {
          console.log(`[CHAT-STREAMING] Streamed ${tokenCount} tokens`);
        }
      }
    }
    
    // Add build version info at the end
    const versionInfo = `\n\nᴮᵘⁱˡᵈ: ${BUILD_VERSION} • ${BUILD_DATE}`;
    res.write(versionInfo);
    responseText += versionInfo;
    
    // Calculate metrics
    const responseTime = Date.now() - startTime;
    totalResponseTime += responseTime;
    const avgResponseTime = totalResponseTime / totalRequests;
    
    // Update cache hits based on context management result
    if (cacheHit) {
      cacheHits++;
    }
    
    const cacheHitRate = (cacheHits / totalRequests) * 100;
    
    console.log('[CHAT-STREAMING] Stream completed');
    console.log(`[CHAT-STREAMING] Response time: ${responseTime}ms`);
    console.log(`[CHAT-STREAMING] Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`[CHAT-STREAMING] Cache hit rate: ${cacheHitRate.toFixed(2)}%`);
    console.log(`[CHAT-STREAMING] Total tokens streamed: ${tokenCount}`);
    console.log(`[CHAT-STREAMING] Context confidence: ${confidence.toFixed(2)}`);
    console.log(`[CHAT-STREAMING] Cache hit: ${cacheHit}`);
    
    // End the stream
    res.end();
    
    // Log metrics for analytics
    await logChatMetrics({
      sessionId,
      query: lastMessage.content,
      responseTime,
      tokenCount,
      cacheHit,
      contextLength: context.length,
      searchResultsCount: searchResults?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CHAT-STREAMING] Error:', error);
    
    try {
      res.write(JSON.stringify({
        error: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
      res.end();
    } catch (writeError) {
      console.error('[CHAT-STREAMING] Failed to write error response:', writeError);
    }
  }
}

// Enhanced metrics logging
async function logChatMetrics(metrics: {
  sessionId: string;
  query: string;
  responseTime: number;
  tokenCount: number;
  cacheHit: boolean;
  contextLength: number;
  searchResultsCount: number;
  timestamp: string;
}) {
  try {
    // Store metrics in Redis for analytics
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (redisUrl) {
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      // Store daily metrics
      const dateKey = new Date().toISOString().split('T')[0];
      const metricsKey = `chat-metrics:${dateKey}`;
      
      await client.lPush(metricsKey, JSON.stringify(metrics));
      await client.expire(metricsKey, 7 * 24 * 60 * 60); // Keep for 7 days
      
      // Store aggregated stats
      const statsKey = 'chat-stats:current';
      await client.hIncrBy(statsKey, 'totalRequests', 1);
      await client.hIncrBy(statsKey, 'totalResponseTime', metrics.responseTime);
      await client.hIncrBy(statsKey, 'totalTokens', metrics.tokenCount);
      if (metrics.cacheHit) {
        await client.hIncrBy(statsKey, 'cacheHits', 1);
      }
      
      await client.disconnect();
    }
  } catch (error) {
    console.error('Failed to log chat metrics:', error);
  }
}

// Export performance metrics for monitoring
export function getPerformanceMetrics() {
  return {
    totalRequests,
    cacheHits,
    cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
    averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
    // Removed cacheSize as it's no longer used
  };
}