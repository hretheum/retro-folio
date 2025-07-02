import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hybridSearchPinecone } from '../../lib/pinecone-vector-store';

// Eryk's knowledge base for context
const ERYK_CONTEXT = `
You are Eryk AI, representing Eryk Orłowski in job interviews and professional conversations.

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
- Small to medium teams (10-50 people ideal)

INSTRUCTIONS:
1. Use the context from Pinecone search results to answer questions
2. Be specific and reference actual projects/experiences when possible
3. If the context doesn't contain relevant information, use general knowledge but stay in character
4. Always maintain Eryk's direct, no-bullshit communication style
`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function generateResponse(userMessage: string, context: string, messages: Message[]): string {
  // Analyze if the message is in Polish
  const isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(userMessage) || 
                   userMessage.toLowerCase().includes('cześć') ||
                   userMessage.toLowerCase().includes('dzień dobry');
  
  const msg = userMessage.toLowerCase();
  
  // If we have relevant context from Pinecone, use it intelligently
  if (context && context.length > 100) {
    // Clean up the context - remove duplicate lines and short fragments
    const contextLines = context.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20) // Remove very short fragments
      .filter((line, index, self) => self.indexOf(line) === index); // Remove duplicates
    
    const cleanContext = contextLines.join('\n\n');
    
    // For questions about Hireverse specifically
    if (msg.includes('hireverse')) {
      const hirerverseContext = contextLines
        .filter(line => line.toLowerCase().includes('hireverse'))
        .join(' ');
      
      if (hirerverseContext) {
        return isPolish
          ? `Hireverse to mój aktualny projekt - platforma AI do rekrutacji, która odwraca tradycyjny proces. ${hirerverseContext}\n\nPo latach frustracji z gównianymi procesami rekrutacyjnymi, postanowiłem to naprawić. Chcesz wiedzieć więcej o technologii czy koncepcji?`
          : `Hireverse is my current project - an AI recruitment platform that flips the traditional process. ${hirerverseContext}\n\nAfter years of frustration with shitty hiring processes, I decided to fix it. Want to know more about the technology or the concept?`;
      }
    }
    
    // Use context but make it conversational
    const contextSummary = cleanContext.substring(0, 1000);
    
    if (isPolish) {
      return `${contextSummary}\n\nTo tyle jeśli chodzi o ${msg.includes('projekt') ? 'moje projekty' : 'to zagadnienie'}. Masz jakieś konkretne pytania?`;
    } else {
      return `${contextSummary}\n\nThat's the gist of ${msg.includes('project') ? 'my projects' : 'it'}. Any specific questions?`;
    }
  }
  
  // Fallback responses when no specific context is found
  
  // Simple pattern matching for common questions
  if (msg.includes('experience') || msg.includes('doświadczenie')) {
    return isPolish
      ? 'Mam 20 lat doświadczenia w projektowaniu produktów cyfrowych. Ostatnio byłem Design Lead w Volkswagen Digital, gdzie skalowałem zespół z 3 do 12 osób. Mogę opowiedzieć więcej o konkretnych projektach - co Cię interesuje?'
      : 'I have 20 years of experience in digital product design. Most recently, I was Design Lead at Volkswagen Digital where I scaled the team from 3 to 12 designers. I can tell you more about specific projects - what interests you?';
  }
  
  if (msg.includes('team') || msg.includes('lead') || msg.includes('zespół')) {
    return isPolish
      ? 'Moja filozofia przywództwa to servant leadership - jestem po to, żeby mój zespół odniósł sukces. W VW przez 2 lata miałem zerową rotację w zespole. Wierzę w autonomię i psychologiczne bezpieczeństwo.'
      : 'My leadership philosophy is servant leadership - I exist to make my team successful. At VW, I maintained zero turnover for 2 years. I believe in autonomy and psychological safety.';
  }
  
  // Generic response
  return isPolish
    ? 'Hmm, mogę powiedzieć więcej, ale potrzebuję konkretniejszego pytania. O czym dokładnie chcesz porozmawiać - moich projektach, doświadczeniu w leadership, czy może podejściu do designu?'
    : "Hmm, I can tell you more, but I need a more specific question. What exactly would you like to know about - my projects, leadership experience, or design approach?";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT] Endpoint called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    console.log('[CHAT] Searching Pinecone for:', lastMessage.content);
    
    // Search Pinecone for relevant context
    let context = '';
    try {
      const searchResults = await hybridSearchPinecone(lastMessage.content, {
        topK: 5,
        namespace: 'production',
      });
      
      console.log('[CHAT] Found', searchResults.length, 'search results');
      
      // Log detailed search results for debugging
      if (searchResults.length > 0) {
        console.log('[CHAT] === DETAILED SEARCH RESULTS ===');
        searchResults.forEach((result, index) => {
          console.log(`[CHAT] Result ${index + 1}:`);
          console.log(`[CHAT] - Score: ${result.score}`);
          console.log(`[CHAT] - Text length: ${result.chunk.text.length}`);
          console.log(`[CHAT] - Text preview: "${result.chunk.text.substring(0, 200)}..."`);
          console.log(`[CHAT] - Metadata:`, JSON.stringify(result.chunk.metadata, null, 2));
          console.log(`[CHAT] - Full text: "${result.chunk.text}"`);
          console.log('[CHAT] ---');
        });
        console.log('[CHAT] === END SEARCH RESULTS ===');
        
        context = searchResults
          .map(r => r.chunk.text)
          .join('\n\n');
        
        console.log(`[CHAT] Combined context length: ${context.length} characters`);
      } else {
        console.log('[CHAT] No search results found');
      }
    } catch (searchError) {
      console.error('[CHAT] Pinecone search error:', searchError);
      // Continue without context if search fails
    }
    
    // Generate response
    const responseText = generateResponse(lastMessage.content, context, messages);
    
    console.log('[CHAT] Sending response');
    
    // Return simple JSON response
    return res.status(200).json({
      content: responseText
    });
    
  } catch (error) {
    console.error('[CHAT] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}