import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { chatContextAdapter } from '../../lib/chat-context-adapter';

// Build version info for tracking
const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';
const BUILD_DATE = new Date().toISOString();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QueryIntent {
  type: 'skillset' | 'project' | 'leadership' | 'technical' | 'comparison' | 'exploration' | 'general';
  confidence: number;
  language: 'polish' | 'english';
  complexity: 'simple' | 'complex';
}

/**
 * Intelligent intent detection for dynamic prompt generation
 */
function detectQueryIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();
  const isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(query) || 
                   lowerQuery.includes('cześć') ||
                   lowerQuery.includes('dzień dobry') ||
                   lowerQuery.includes('umiejętności') ||
                   lowerQuery.includes('kompetencje') ||
                   lowerQuery.includes('potrafisz');

  // Intent classification
  let type: QueryIntent['type'] = 'general';
  let confidence = 0.7;
  let complexity: 'simple' | 'complex' = 'simple';

  if (lowerQuery.match(/umiejętności|kompetencje|potrafisz|skills|expertise|technologies|tech stack/i)) {
    type = 'skillset';
    confidence = 0.95;
  } else if (lowerQuery.match(/projekt|project|volkswagen|vw|polsat|tvp|hireverse|allegro|mbank|revolut/i)) {
    type = 'project';
    confidence = 0.9;
  } else if (lowerQuery.match(/zespół|team|lead|leadership|zarządzanie|management|przywództwo/i)) {
    type = 'leadership';
    confidence = 0.9;
  } else if (lowerQuery.match(/technologie|technologies|react|typescript|ai|ml|design|figma|sketch/i)) {
    type = 'technical';
    confidence = 0.85;
  } else if (lowerQuery.match(/porównaj|compare|różnica|difference|vs|versus/i)) {
    type = 'comparison';
    confidence = 0.8;
    complexity = 'complex';
  } else if (lowerQuery.match(/opowiedz|tell me|więcej|more|szczegół|detail|jak|how|dlaczego|why/i)) {
    type = 'exploration';
    confidence = 0.8;
  }

  // Detect complex queries
  if (query.length > 100 || lowerQuery.includes('porównaj') || lowerQuery.includes('compare')) {
    complexity = 'complex';
  }

  return {
    type,
    confidence,
    language: isPolish ? 'polish' : 'english',
    complexity
  };
}

/**
 * Dynamic system prompt based on detected intent
 */
function buildDynamicSystemPrompt(intent: QueryIntent): string {
  const basePrompt = `You are Eryk AI - intelligent assistant representing Eryk Orłowski.

CORE IDENTITY:
- 20 years of experience in digital product design
- Currently unemployed, building Hireverse.app (AI recruiter that flips traditional recruiting)
- Last role: Design Lead at Volkswagen Digital (scaled team 3→12, zero turnover for 2 years)
- Notable projects: Polsat Box Go (2M+ users, +45% retention), TVP VOD (first with audio descriptions)
- Specializes in: Design Systems, Team Leadership, Product Strategy, UX/UI Design

PERSONALITY & COMMUNICATION STYLE:
- Direct and honest, sometimes brutally so
- Values autonomy and hates corporate bullshit
- Uses casual, conversational tone
- If asked in Polish, respond in Polish
- Don't sugarcoat - if they're not a match, say so

PREFERENCES:
- Remote/hybrid work strongly preferred (dealbreaker if full office)
- Servant leadership approach
- Outcome-based management over micromanagement
- Small to medium teams (10-50 people ideal)`;

  const intentSpecificPrompt = (() => {
    switch (intent.type) {
      case 'skillset':
        return `
INTENT: SKILLSET ANALYSIS
INSTRUCTIONS:
- Extract ALL skills from the ENTIRE context provided
- Group skills by categories (Design, Leadership, Technologies, etc.)
- Be comprehensive - don't miss any mentioned skills
- Use bullet points for clarity
- Include both technical and soft skills
- Reference specific projects where skills were demonstrated`;

      case 'project':
        return `
INTENT: PROJECT DETAILS
INSTRUCTIONS:
- Focus on specific project details from context
- Include role, achievements, technologies used
- Mention team size and impact metrics
- Use button-prompt format for interactive elements
- Structure by company/project with clear sections`;

      case 'leadership':
        return `
INTENT: LEADERSHIP APPROACH
INSTRUCTIONS:
- Explain leadership philosophy and approach
- Reference specific team management experiences
- Include metrics like team growth, retention rates
- Emphasize servant leadership and autonomy
- Share lessons learned and management style`;

      case 'technical':
        return `
INTENT: TECHNICAL EXPERTISE
INSTRUCTIONS:
- List all technologies and tools mentioned
- Include proficiency levels where indicated
- Group by categories (Design Tools, Programming, AI/ML, etc.)
- Reference specific projects where technologies were used
- Include both current and historical tech stack`;

      case 'comparison':
        return `
INTENT: COMPARATIVE ANALYSIS
INSTRUCTIONS:
- Compare different projects, companies, or approaches
- Identify patterns and differences
- Provide insights on what worked and why
- Use structured comparison format
- Include lessons learned from different experiences`;

      case 'exploration':
        return `
INTENT: DETAILED EXPLORATION
INSTRUCTIONS:
- Provide comprehensive, detailed responses
- Include context, background, and outcomes
- Tell stories and share experiences
- Use natural, conversational tone
- Encourage follow-up questions with button-prompts`;

      default:
        return `
INTENT: GENERAL CONVERSATION
INSTRUCTIONS:
- Provide helpful, informative responses
- Use context when available
- Maintain Eryk's direct communication style
- Ask clarifying questions when needed
- Guide conversation toward specific topics of interest`;
    }
  })();

  const languageInstruction = intent.language === 'polish' 
    ? 'RESPOND IN POLISH - use Polish language throughout the response'
    : 'RESPOND IN ENGLISH - use English language throughout the response';

  return `${basePrompt}

${intentSpecificPrompt}

${languageInstruction}

CONTEXT ANALYSIS RULES:
1. Always use the provided context as primary source
2. If context is empty or irrelevant, acknowledge this honestly
3. Extract specific details, metrics, and achievements from context
4. Structure responses clearly with proper formatting
5. Use button-prompt format for interactive elements: <button-prompt="topic">text</button-prompt>
6. Be specific and reference actual projects/experiences
7. Maintain Eryk's authentic voice and personality`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT] Endpoint called - Build:', BUILD_VERSION, 'Date:', BUILD_DATE);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { messages, sessionId } = req.body;
    console.log('[CHAT] Messages:', messages?.length, 'SessionId:', sessionId);
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return res.status(400).json({ error: 'No message content' });
    }

    console.log('[CHAT] Processing query:', lastMessage.content);
    
    // Step 1: Detect query intent
    const intent = detectQueryIntent(lastMessage.content);
    console.log('[CHAT] Detected intent:', intent);
    
    // Step 2: Get context using full context management system
    let context = '';
    let searchResults: any[] = [];
    let confidence = 0;
    let cacheHit = false;
    let pipelineStages: string[] = [];
    
    try {
      console.log('[CHAT] Using full context management pipeline');
      
      const contextResult = await chatContextAdapter.getContext(lastMessage.content, {
        sessionId,
        maxTokens: 4000,
        namespace: 'production'
      });
      
      context = contextResult.context;
      searchResults = contextResult.searchResults;
      confidence = contextResult.confidence;
      cacheHit = contextResult.performanceMetrics.cacheHit;
      pipelineStages = contextResult.performanceMetrics.stages;
      
      console.log('[CHAT] Context management completed:', {
        contextLength: context.length,
        searchResultsCount: searchResults.length,
        confidence,
        stages: pipelineStages,
        cacheHit,
        totalTime: contextResult.performanceMetrics.totalTime
      });
      
    } catch (contextError) {
      console.error('[CHAT] Context management error:', contextError);
      // Continue with empty context - LLM will handle it gracefully
    }
    
    // Step 3: Build dynamic system prompt
    const systemPrompt = buildDynamicSystemPrompt(intent);
    
    // Step 4: Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Here is the context from my experience database:

CONTEXT:
${context || 'NO CONTEXT FOUND - The search returned no relevant results'}

USER QUESTION: ${lastMessage.content}

DETECTED INTENT: ${intent.type} (confidence: ${intent.confidence})
LANGUAGE: ${intent.language}
COMPLEXITY: ${intent.complexity}

Please respond according to the intent-specific instructions above.` }
    ];
    
    console.log('[CHAT] Sending to OpenAI with intent:', intent.type);
    
    // Step 5: Generate response with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800,
    });
    
    const responseText = completion.choices[0]?.message?.content || 'Przepraszam, nie udało się wygenerować odpowiedzi.';
    const tokensUsed = completion.usage?.total_tokens || 0;
    
    // Step 6: Add version info
    const versionInfo = `\n\nᴮᵘⁱˡᵈ: ${BUILD_VERSION} • ${BUILD_DATE}`;
    const finalResponse = responseText + versionInfo;
    
    const responseTime = Date.now() - startTime;
    
    console.log('[CHAT] Response generated successfully:', {
      responseTime,
      tokensUsed,
      intent: intent.type,
      confidence,
      cacheHit,
      pipelineStages: pipelineStages.length,
      contextLength: context.length
    });
    
    // Step 7: Return response with metadata
    return res.status(200).json({
      content: finalResponse,
      metadata: {
        intent: intent.type,
        confidence: intent.confidence,
        language: intent.language,
        complexity: intent.complexity,
        contextLength: context.length,
        searchResultsCount: searchResults.length,
        pipelineStages,
        cacheHit,
        responseTime,
        tokensUsed,
        buildVersion: BUILD_VERSION,
        buildDate: BUILD_DATE
      }
    });
    
  } catch (error) {
    console.error('[CHAT] Error:', error);
    const errorResponse = {
      content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        buildVersion: BUILD_VERSION,
        buildDate: BUILD_DATE
      }
    };
    
    return res.status(500).json(errorResponse);
  }
}