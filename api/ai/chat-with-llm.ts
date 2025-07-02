import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hybridSearchPinecone } from '../../lib/pinecone-vector-store';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
Personality: Be direct, honest, no corporate bullshit.`;

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
      // Enhance search query based on user intent
      let searchQuery = lastMessage.content;
      const lowerContent = lastMessage.content.toLowerCase();
      
      // Map specific queries to broader searches
      if (lowerContent.includes('bank') || lowerContent.includes('finanse') || lowerContent.includes('finance')) {
        searchQuery = 'bank finance fintech mBank Revolut ING financial services payments';
      } else if (lowerContent.includes('projekt') || lowerContent.includes('project') || 
                 lowerContent.includes('doświadczenie') || lowerContent.includes('experience')) {
        searchQuery = 'projects experience portfolio Volkswagen Revolut Spotify mBank ING Polsat Allegro GitLab design lead senior';
      } else if (lowerContent.includes('wszystkie') || lowerContent.includes('all') || 
                 lowerContent.includes('inne') || lowerContent.includes('other')) {
        searchQuery = 'Volkswagen Revolut Spotify mBank ING Polsat Allegro GitLab Cognition Labs Hireverse design system robo-advisor';
      }
      
      console.log('[CHAT-LLM] Search query:', searchQuery);
      
      // Check cache first
      const cacheKey = searchQuery.toLowerCase();
      const cached = searchCache.get(cacheKey);
      let searchResults;
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[CHAT-LLM] Using cached results');
        searchResults = cached.results;
      } else {
        searchResults = await hybridSearchPinecone(searchQuery, {
          topK: 15, // Increase even more for better variety
          namespace: 'production',
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

IMPORTANT: 
- If user asks about banks/finance, show ALL financial projects (mBank, Revolut, ING, etc.)
- If user asks about projects in general, show 5-8 diverse projects
- Create SEPARATE formatted blocks for EACH company/project found in the context
- Do NOT filter or limit to just one project unless user asks for specific company` }
    ];
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800,
    });
    
    const responseText = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    console.log('[CHAT-LLM] Sending response');
    
    return res.status(200).json({
      content: responseText
    });
    
  } catch (error) {
    console.error('[CHAT-LLM] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}