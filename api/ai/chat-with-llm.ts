import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatContextAdapter } from '../../lib/chat-context-adapter';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Build version info
// @ts-ignore
const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';

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

SPECIAL HANDLING:
- Only use fallback responses for truly nonsensical input (random characters, "asdasd", etc.)
- For normal questions without context, try to be helpful and suggest what you can help with
- If context is empty but question is valid, acknowledge this and offer to help with other topics
- Be less strict about what constitutes a "valid" question - users may ask in different ways

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

IMPORTANT DISCLAIMER:
Always end your response with an appropriate disclaimer in the same language as the user's question:
- English: "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience."
- Polish: "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT-LLM] Endpoint called');
  
  // Generate build date for this request
  const BUILD_DATE = new Date().toISOString().split('T')[0];
  
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
    
    // Search for relevant context using the full context management system
    let context = '';
    let searchResults: any[] = [];
    let confidence = 0;
    let cacheHit = false;
    
    try {
      const searchQuery = lastMessage.content;
      
      console.log('[CHAT-LLM] Original query:', searchQuery);
      
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
      
      console.log('[CHAT-LLM] Context management completed:', {
        contextLength: context.length,
        searchResultsCount: searchResults.length,
        confidence,
        stages: contextResult.performanceMetrics.stages,
        totalTime: contextResult.performanceMetrics.totalTime
      });
      
      // Log what was returned for debugging
      searchResults.slice(0, 3).forEach((result, index) => {
        const text = result.chunk?.text || result.content || result.text || '';
        console.log(`[CHAT-LLM] Result ${index + 1}:`);
        console.log(`[CHAT-LLM] Text preview: ${text.substring(0, 150)}...`);
        if (result.chunk?.metadata || result.metadata) {
          console.log(`[CHAT-LLM] Metadata:`, result.chunk?.metadata || result.metadata);
        }
      });
      
    } catch (searchError) {
      console.error('[CHAT-LLM] Context management error:', searchError);
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
3. Analyze user's intent:
   - "banki" / "banks" → Show ALL banking/fintech projects found in context
   - "projekty" / "projects" → Show diverse selection of 5-8 projects
   - "inne" / "other" / "więcej" / "more" → Show additional projects not yet shown
   - "umiejętności" / "skills" → Extract ALL skills from ENTIRE context
   
4. ALWAYS create SEPARATE blocks for EACH company found in context
5. Do NOT arbitrarily limit results - if context has 5 banks, show all 5
6. Group similar projects (e.g., all fintech together) but still show each separately
7. If user asks about specific domain (finance, design systems, etc.), prioritize those
8. For skills questions, provide comprehensive overview from ALL context
9. DO NOT add build version info - it will be added automatically` }
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