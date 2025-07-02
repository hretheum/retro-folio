import { createClient } from 'redis';

export interface ExtractedContent {
  id: string;
  type: 'work' | 'timeline' | 'experiment' | 'leadership' | 'contact';
  title: string;
  content: string;
  metadata: {
    date?: string;
    tags?: string[];
    technologies?: string[];
    featured?: boolean;
    url?: string;
    role?: string;
  };
}

// Helper to normalize and combine content fields
function extractTextContent(item: any, type: string): string {
  const parts: string[] = [];
  
  switch (type) {
    case 'work':
      parts.push(item.companyTitle || '');
      parts.push(item.position || '');
      parts.push(item.description || '');
      if (item.insights?.length) {
        parts.push(...item.insights);
      }
      break;
      
    case 'timeline':
      parts.push(item.title || '');
      parts.push(item.label || '');
      parts.push(item.content || '');
      break;
      
    case 'experiment':
      parts.push(item.title || '');
      parts.push(item.description || '');
      if (item.learnings?.length) {
        parts.push('Learnings:', ...item.learnings);
      }
      break;
      
    case 'leadership':
      parts.push(item.title || '');
      parts.push(item.value || '');
      parts.push(item.description || '');
      if (item.examples?.length) {
        parts.push('Examples:', ...item.examples);
      }
      break;
      
    case 'contact':
      parts.push(item.label || '');
      parts.push(item.value || '');
      parts.push(item.description || '');
      break;
  }
  
  return parts.filter(Boolean).join(' ');
}

// Extract metadata based on content type
function extractMetadata(item: any, type: string): ExtractedContent['metadata'] {
  const metadata: ExtractedContent['metadata'] = {};
  
  if (item.date) metadata.date = item.date;
  if (item.tags) metadata.tags = Array.isArray(item.tags) ? item.tags : [item.tags];
  if (item.technologies) metadata.technologies = item.technologies;
  if (item.featured !== undefined) metadata.featured = item.featured;
  if (item.link || item.url) metadata.url = item.link || item.url;
  if (item.role) metadata.role = item.role;
  
  // Type-specific metadata
  switch (type) {
    case 'experiment':
      if (item.status) metadata.tags = [...(metadata.tags || []), item.status];
      break;
    case 'leadership':
      if (item.category) metadata.tags = [...(metadata.tags || []), item.category];
      break;
  }
  
  return metadata;
}

// Fetch all content from Redis/localStorage
export async function fetchAllCMSContent(): Promise<ExtractedContent[]> {
  const contentTypes = ['work', 'timeline', 'experiment', 'leadership', 'contact'];
  const allContent: ExtractedContent[] = [];
  
  try {
    // Try Redis first
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (redisUrl) {
      const client = createClient({ url: redisUrl });
      await client.connect();
      
      for (const type of contentTypes) {
        const key = `content:${type}`;
        const data = await client.get(key);
        
        if (data) {
          const items = JSON.parse(data);
          
          for (const item of items) {
            allContent.push({
              id: `${type}-${item.id || Date.now()}`,
              type: type as ExtractedContent['type'],
              title: item.title || item.companyTitle || item.label || 'Untitled',
              content: extractTextContent(item, type),
              metadata: extractMetadata(item, type),
            });
          }
        }
      }
      
      await client.disconnect();
    }
  } catch (error) {
    console.error('Error fetching from Redis:', error);
    // In a real scenario, we'd fall back to localStorage or another source
  }
  
  return allContent;
}

// Normalize and prepare content for processing
export function normalizeContent(content: ExtractedContent[]): ExtractedContent[] {
  return content.map(item => {
    // Ensure content is not empty
    const cleanContent = (item.content || item.title).trim().replace(/\s+/g, ' ');
    return {
      ...item,
      title: item.title.trim(),
      content: cleanContent,
    };
  }).filter(item => item.content.length > 10); // Filter out too short content
}