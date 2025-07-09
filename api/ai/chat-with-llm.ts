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

// Simple in-memory cache for Pinecone results (resets on function cold start)
const searchCache = new Map<string, { results: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

Example of CORRECT formatting:

**[Projekt: Revolut - Senior Product Designer]**
• Designed AI-powered robo-advisor interface for 2M+ users
• Created educational onboarding reducing investment anxiety
• Built real-time portfolio visualization with predictive analytics
• Achieved 65% adoption rate among eligible users
<button-prompt="Revolut">Opowiedz mi więcej →</button-prompt>

**[Projekt: Spotify - Design Systems Consultant]**
• Automated 95% of design token update process
• Reduced design-code inconsistencies by 88%
• Created CI/CD pipeline for design system updates
• Cut implementation time from days to minutes
<button-prompt="Spotify">Opowiedz mi więcej →</button-prompt>

Language: Use Polish if user writes in Polish, English otherwise.
Personality: Be direct, honest, no corporate bullshit.

IMPORTANT DISCLAIMER:
Always end your response with an appropriate disclaimer in the same language as the user's question:
- English: "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience."
- Polish: "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."

BUILD VERSION INFO:
Always include build version at the very end (after disclaimer) in a subtle format:
- English: "ᴮᵘⁱˡᵈ: [commit-hash] • [date]"
- Polish: "ᴮᵘⁱˡᵈ: [commit-hash] • [date]"`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT-LLM] Endpoint called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, sessionId } = req.body;
    console.log('[CHAT-LLM] Messages:', messages?.length);
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return res.status(400).json({ error: 'No message content' });
    }
    
    // Search Pinecone for relevant context
    let context = '';
    try {
      // Use the original query - let Pinecone handle semantic search
      const searchQuery = lastMessage.content;
      
      // For very short queries, add context
      const enhancedQuery = searchQuery.split(' ').length < 3 
        ? `${searchQuery} projects experience work` 
        : searchQuery;
      
      console.log('[CHAT-LLM] Search query:', enhancedQuery);
      
      // Check cache first
      const cacheKey = enhancedQuery.toLowerCase();
      const cached = searchCache.get(cacheKey);
      let searchResults;
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[CHAT-LLM] Using cached results');
        searchResults = cached.results;
      } else {
        searchResults = await hybridSearchPinecone(enhancedQuery, {
          topK: 20, // Get many results - let LLM decide what's relevant
          namespace: 'production',
          vectorWeight: 0.7 // Default weight for semantic search
        });
        
        // Cache the results
        searchCache.set(cacheKey, {
          results: searchResults,
          timestamp: Date.now()
        });
      }
      
      console.log('[CHAT-LLM] Found', searchResults.length, 'search results');
      
      // Log what Pinecone returned for debugging
      searchResults.forEach((result, index) => {
        console.log(`[CHAT-LLM] Result ${index + 1} (score: ${result.score}):`);
        console.log(`[CHAT-LLM] Text preview: ${result.chunk.text.substring(0, 150)}...`);
        console.log(`[CHAT-LLM] Metadata:`, result.chunk.metadata);
      });
      
      if (searchResults.length > 0) {
        // Deduplicate and ensure variety of projects
        const seenContent = new Set<string>();
        const diverseResults = searchResults.filter(result => {
          const text = result.chunk.text.toLowerCase();
          const key = text.substring(0, 100); // Use first 100 chars as key
          
          if (seenContent.has(key)) {
            return false;
          }
          seenContent.add(key);
          return true;
        });
        
        console.log(`[CHAT-LLM] After deduplication: ${diverseResults.length} unique results`);
        
        context = diverseResults
          .map(r => r.chunk.text)
          .join('\n\n---\n\n'); // Add separator between chunks
      }
    } catch (searchError) {
      console.error('[CHAT-LLM] Pinecone search error:', searchError);
    }
    
    // Build messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: `Here is raw context from my experience database. Parse it and format according to the rules:

CONTEXT:
${context}

USER QUESTION: ${lastMessage.content}

IMPORTANT INSTRUCTIONS:
1. Analyze user's intent:
   - "banki" / "banks" → Show ALL banking/fintech projects found in context
   - "projekty" / "projects" → Show diverse selection of 5-8 projects
   - "inne" / "other" / "więcej" / "more" → Show additional projects not yet shown
   
2. ALWAYS create SEPARATE blocks for EACH company found in context
3. Do NOT arbitrarily limit results - if context has 5 banks, show all 5
4. Group similar projects (e.g., all fintech together) but still show each separately
5. If user asks about specific domain (finance, design systems, etc.), prioritize those
6. Include build version info at the very end: ᴮᵘⁱˡᵈ: ${BUILD_VERSION} • ${BUILD_DATE}` }
    ];
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800,
    });
    
    const responseText = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Add build version info at the end
    const versionInfo = `\n\nᴮᵘⁱˡᵈ: ${BUILD_VERSION} • ${BUILD_DATE}`;
    const finalResponse = responseText + versionInfo;
    
    console.log('[CHAT-LLM] Sending response');
    console.log('[BUILD_INFO] Added version:', BUILD_VERSION, BUILD_DATE);
    
    return res.status(200).json({
      content: finalResponse
    });
    
  } catch (error) {
    console.error('[CHAT-LLM] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}