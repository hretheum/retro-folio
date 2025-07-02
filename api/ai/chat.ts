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

function formatProjectResponse(projectName: string, achievements: string[], isPolish: boolean): string {
  // Limit to top 4 achievements per project for better readability
  const topAchievements = achievements
    .filter(a => a.length > 10)
    .slice(0, 4)
    .map(a => `• ${a.trim()}`)
    .join('\n');
  
  const tellMeMore = isPolish ? 'Opowiedz mi więcej' : 'Tell me more';
  
  return `**[Projekt: ${projectName}]**

${topAchievements}

<button-prompt="${projectName}">${tellMeMore} →</button-prompt>`;
}

interface ProjectData {
  name: string;
  role?: string;
  achievements: string[];
}

function extractMultipleProjects(context: string): ProjectData[] {
  const lines = context.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const projects: ProjectData[] = [];
  
  // Known project patterns with company names and roles
  const projectPatterns = [
    /^(.*?)\s+(Senior Product Designer|Product Designer|Design Lead|Lead Designer|Consultant|Product Design Consultant)$/i,
    /^(Volkswagen Digital|Polsat Box Go|TVP VOD|ING Bank|Hireverse|Allegro|mBank|Revolut)\s*(.*)$/i
  ];
  
  let currentProject: ProjectData | null = null;
  
  for (const line of lines) {
    // Check if this line is a new project header
    let isNewProject = false;
    
    for (const pattern of projectPatterns) {
      const match = line.match(pattern);
      if (match) {
        // Save previous project if exists
        if (currentProject && currentProject.achievements.length > 0) {
          projects.push(currentProject);
        }
        
        // Start new project
        const companyName = match[1].trim();
        const role = match[2] ? match[2].trim() : '';
        
        currentProject = {
          name: companyName,
          role: role || undefined,
          achievements: []
        };
        isNewProject = true;
        break;
      }
    }
    
    // If not a new project header and we have a current project, check if it's an achievement
    if (!isNewProject && currentProject) {
      // Skip lines that are just project names repeated
      if (line.toLowerCase().includes(currentProject.name.toLowerCase()) && line.length < 50) {
        continue;
      }
      
      // Check if line describes an achievement
      if (line.length > 30 && (
        line.match(/\d+|%|scaled|improved|created|built|reduced|designed|implemented|developed|led|managed|osiągnęliśmy|zaprojektowałem|stworzyłem|wprowadziłem|zbudowałem/i) ||
        line.includes('•') ||
        line.includes('-')
      )) {
        // Clean up the line
        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleanLine.length > 20) {
          currentProject.achievements.push(cleanLine);
        }
      }
    }
  }
  
  // Don't forget the last project
  if (currentProject && currentProject.achievements.length > 0) {
    projects.push(currentProject);
  }
  
  return projects;
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
    
    // Try to extract multiple projects for better formatting
    const projects = extractMultipleProjects(context);
    
    // If we found projects, format them properly
    if (projects.length > 0) {
      const intro = isPolish 
        ? 'Oto moje doświadczenie:\n\n'
        : "Here's my experience:\n\n";
      
      const projectResponses = projects.map(project => {
        const projectTitle = project.role 
          ? `${project.name} - ${project.role}`
          : project.name;
        
        return formatProjectResponse(projectTitle, project.achievements, isPolish);
      }).join('\n\n');
      
      return intro + projectResponses;
    }
    
    // For questions about Hireverse specifically
    if (msg.includes('hireverse')) {
      const achievements = [
        isPolish ? 'Platforma AI do rekrutacji która odwraca tradycyjny proces' : 'AI recruitment platform that flips traditional hiring',
        isPolish ? 'Kandydaci rozmawiają z AI zamiast rekruterów' : 'Candidates talk to AI instead of recruiters',
        isPolish ? 'Eliminuje bias i bullshit z procesów rekrutacyjnych' : 'Eliminates bias and bullshit from hiring processes',
        isPolish ? 'Budowane na najnowszych technologiach AI i NLP' : 'Built with cutting-edge AI and NLP technologies'
      ];
      
      return formatProjectResponse('Hireverse', achievements, isPolish);
    }
    
    // For other contexts, use a cleaner format
    const contextSummary = cleanContext.substring(0, 800);
    
    if (isPolish) {
      return `${contextSummary}\n\n**Chcesz wiedzieć więcej?** Zapytaj o konkretny projekt lub aspekt mojej pracy.`;
    } else {
      return `${contextSummary}\n\n**Want to know more?** Ask about a specific project or aspect of my work.`;
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