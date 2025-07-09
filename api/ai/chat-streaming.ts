import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hybridSearchPinecone } from '../../lib/pinecone-vector-store';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build version info
// @ts-ignore
const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';
const BUILD_DATE = new Date().toISOString().split('T')[0];

console.log('[BUILD_INFO] Version:', BUILD_VERSION, 'Date:', BUILD_DATE);

// Enhanced cache with TTL and metrics
const searchCache = new Map<string, { 
  results: any[], 
  timestamp: number,
  hitCount: number 
}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Performance metrics
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

Language: Use Polish if user writes in Polish, English otherwise.
Personality: Be direct, honest, no corporate bullshit.
Response style: Stream naturally, don't wait for complete thoughts.

IMPORTANT DISCLAIMER:
Always end your response with an appropriate disclaimer in the same language as the user's question:
- English: "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience."
- Polish: "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."

BUILD VERSION INFO:
Always include build version at the very end (after disclaimer) in a subtle format:
- English: "ᴮᵘⁱˡᵈ: [commit-hash] • [date]"
- Polish: "ᴮᵘⁱˡᵈ: [commit-hash] • [date]"`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  totalRequests++;
  
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

    // Search Pinecone for relevant context with enhanced caching
    let context = '';
    let cacheHit = false;
    let searchResults: any[] = [];
    
    try {
      const searchQuery = lastMessage.content;
      const enhancedQuery = searchQuery.split(' ').length < 3 
        ? `${searchQuery} projects experience work` 
        : searchQuery;
      
      console.log('[CHAT-STREAMING] Search query:', enhancedQuery);
      
      // Enhanced cache checking
      const cacheKey = enhancedQuery.toLowerCase();
      const cached = searchCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[CHAT-STREAMING] Using cached results');
        searchResults = cached.results;
        cached.hitCount++;
        cacheHit = true;
        cacheHits++;
      } else {
        const searchStart = Date.now();
        searchResults = await hybridSearchPinecone(enhancedQuery, {
          topK: 20,
          namespace: 'production',
          vectorWeight: 0.7
        });
        
        const searchTime = Date.now() - searchStart;
        console.log(`[CHAT-STREAMING] Search completed in ${searchTime}ms`);
        
        // Cache the results with metrics
        searchCache.set(cacheKey, {
          results: searchResults,
          timestamp: Date.now(),
          hitCount: 1
        });

        // Clean old cache entries to prevent memory leaks
        if (searchCache.size > 100) {
          const oldestKey = [...searchCache.entries()]
            .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0];
          searchCache.delete(oldestKey);
        }
      }
      
      console.log('[CHAT-STREAMING] Found', searchResults.length, 'search results');
      
      if (searchResults.length > 0) {
        // Enhanced deduplication with similarity scoring
        const seenContent = new Set<string>();
        const diverseResults = searchResults.filter(result => {
          const text = result.chunk.text.toLowerCase();
          const key = text.substring(0, 100);
          
          if (seenContent.has(key)) {
            return false;
          }
          seenContent.add(key);
          return true;
        });
        
        context = diverseResults
          .map(r => r.chunk.text)
          .join('\n\n---\n\n');
      }
    } catch (searchError) {
      console.error('[CHAT-STREAMING] Pinecone search error:', searchError);
    }
    
    // Build messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: `Here is raw context from my experience database. Parse it and format according to the rules:

CONTEXT:
${context}

USER QUESTION: ${lastMessage.content}

IMPORTANT INSTRUCTIONS:
1. Analyze user's intent and respond appropriately
2. ALWAYS create SEPARATE blocks for EACH company found in context
3. Stream your response naturally - don't wait for complete thoughts
4. Use the button-prompt format for interactive elements
5. Include build version info at the very end: ᴮᵘⁱˡᵈ: ${BUILD_VERSION} • ${BUILD_DATE}` }
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
    const cacheHitRate = (cacheHits / totalRequests) * 100;
    
    console.log('[CHAT-STREAMING] Stream completed');
    console.log(`[CHAT-STREAMING] Response time: ${responseTime}ms`);
    console.log(`[CHAT-STREAMING] Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`[CHAT-STREAMING] Cache hit rate: ${cacheHitRate.toFixed(2)}%`);
    console.log(`[CHAT-STREAMING] Total tokens streamed: ${tokenCount}`);
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
    cacheSize: searchCache.size
  };
}