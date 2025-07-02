import { estimateTokens } from './openai';
import type { ExtractedContent } from './content-extractor';

export interface TextChunk {
  id: string;
  text: string;
  metadata: ExtractedContent['metadata'] & {
    contentId: string;
    contentType: ExtractedContent['type'];
    chunkIndex: number;
    totalChunks: number;
  };
  tokens: number;
}

export interface ChunkingOptions {
  maxTokens?: number;
  overlap?: number;
  preserveSentences?: boolean;
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxTokens: 512,
  overlap: 50,
  preserveSentences: true,
};

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  // Regex to match sentence boundaries
  const sentenceRegex = /[.!?]+[\s]+|[.!?]+$/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining.length > 0) {
      sentences.push(remaining);
    }
  }
  
  return sentences;
}

// Create chunks with overlap
function createChunksWithOverlap(
  sentences: string[],
  maxTokens: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let overlapBuffer: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokens(sentence);
    
    // If single sentence exceeds max tokens, split it
    if (sentenceTokens > maxTokens) {
      // Save current chunk if it has content
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        // Prepare overlap for next chunk
        overlapBuffer = currentChunk.slice(-Math.ceil(currentChunk.length / 3));
        currentChunk = [];
        currentTokens = 0;
      }
      
      // Split long sentence by words
      const words = sentence.split(' ');
      let wordChunk: string[] = [];
      let wordTokens = 0;
      
      for (const word of words) {
        const wordTokenCount = estimateTokens(word + ' ');
        if (wordTokens + wordTokenCount > maxTokens && wordChunk.length > 0) {
          chunks.push(wordChunk.join(' '));
          wordChunk = [word];
          wordTokens = wordTokenCount;
        } else {
          wordChunk.push(word);
          wordTokens += wordTokenCount;
        }
      }
      
      if (wordChunk.length > 0) {
        currentChunk = wordChunk;
        currentTokens = wordTokens;
      }
    } else if (currentTokens + sentenceTokens > maxTokens) {
      // Current chunk is full, save it
      chunks.push(currentChunk.join(' '));
      
      // Start new chunk with overlap
      overlapBuffer = [];
      let overlapTokens = 0;
      
      // Add sentences from the end of current chunk for overlap
      for (let j = currentChunk.length - 1; j >= 0 && overlapTokens < overlap; j--) {
        const overlapSentence = currentChunk[j];
        const overlapSentenceTokens = estimateTokens(overlapSentence);
        if (overlapTokens + overlapSentenceTokens <= overlap) {
          overlapBuffer.unshift(overlapSentence);
          overlapTokens += overlapSentenceTokens;
        }
      }
      
      currentChunk = [...overlapBuffer, sentence];
      currentTokens = overlapTokens + sentenceTokens;
    } else {
      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentTokens += sentenceTokens;
    }
  }
  
  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}

// Main chunking function
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): { text: string; tokens: number }[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // If text is already small enough, return as single chunk
  const totalTokens = estimateTokens(text);
  if (totalTokens <= opts.maxTokens) {
    return [{ text: text.trim(), tokens: totalTokens }];
  }
  
  // Split into sentences if preserving sentences
  const sentences = opts.preserveSentences
    ? splitIntoSentences(text)
    : [text];
  
  // Create chunks with overlap
  const chunkTexts = createChunksWithOverlap(
    sentences,
    opts.maxTokens,
    opts.overlap
  );
  
  // Calculate tokens for each chunk
  return chunkTexts.map(chunkText => ({
    text: chunkText,
    tokens: estimateTokens(chunkText),
  }));
}

// Process ExtractedContent into chunks
export function chunkContent(
  content: ExtractedContent,
  options: ChunkingOptions = {}
): TextChunk[] {
  const textChunks = chunkText(content.content, options);
  
  return textChunks.map((chunk, index) => ({
    id: `${content.id}-chunk-${index}`,
    text: chunk.text,
    metadata: {
      ...content.metadata,
      contentId: content.id,
      contentType: content.type,
      chunkIndex: index,
      totalChunks: textChunks.length,
    },
    tokens: chunk.tokens,
  }));
}

// Process multiple contents into chunks
export function chunkContents(
  contents: ExtractedContent[],
  options: ChunkingOptions = {}
): TextChunk[] {
  const allChunks: TextChunk[] = [];
  
  for (const content of contents) {
    const chunks = chunkContent(content, options);
    allChunks.push(...chunks);
  }
  
  return allChunks;
}