import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hybridSearchPinecone } from '../../lib/pinecone-vector-store';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Eryk AI, representing Eryk Orłowski. Format your responses with proper structure:

For project listings, use this EXACT format:
**[Projekt: Company Name - Role]**
• Achievement 1
• Achievement 2
• Achievement 3
• Achievement 4
<button-prompt="Company Name">Opowiedz mi więcej →</button-prompt>

Rules:
1. Each project gets its own block with max 4 bullet points
2. Use Polish if the user writes in Polish
3. Be direct and honest, no corporate bullshit
4. Keep achievements concise and impactful
5. Always end project blocks with the button prompt`;

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
      const searchResults = await hybridSearchPinecone(lastMessage.content, {
        topK: 8,
        namespace: 'production',
      });
      
      console.log('[CHAT-LLM] Found', searchResults.length, 'search results');
      
      if (searchResults.length > 0) {
        context = searchResults
          .map(r => r.chunk.text)
          .join('\n\n');
      }
    } catch (searchError) {
      console.error('[CHAT-LLM] Pinecone search error:', searchError);
    }
    
    // Build messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: `Context from my experience:\n${context}\n\nUser question: ${lastMessage.content}` }
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