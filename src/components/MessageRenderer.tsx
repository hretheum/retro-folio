import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MessageRendererProps {
  content: string;
  onPromptClick: (prompt: string) => void;
}

export function MessageRenderer({ content, onPromptClick }: MessageRendererProps) {
  // Parse the content to handle markdown and special button syntax
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let inList = false;
    
    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-none space-y-2 my-3">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
    };
    
    lines.forEach((line, index) => {
      // Handle button prompts: <button-prompt="Project Name">Tell me more →</button-prompt>
      const buttonMatch = line.match(/<button-prompt="([^"]+)">([^<]+)<\/button-prompt>/);
      if (buttonMatch) {
        flushList();
        const [, projectName, buttonText] = buttonMatch;
        elements.push(
          <button
            key={`btn-${index}`}
            onClick={() => onPromptClick(`Tell me more about ${projectName}`)}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                     text-blue-400 rounded-lg transition-colors border border-blue-500/30"
          >
            {buttonText}
            <ChevronRight className="w-4 h-4" />
          </button>
        );
        return;
      }
      
      // Handle project headers: **[Projekt: Name]**
      const projectMatch = line.match(/\*\*\[([^\]]+)\]\*\*/);
      if (projectMatch) {
        flushList();
        elements.push(
          <h3 key={`header-${index}`} className="text-blue-400 text-lg font-semibold mb-3 mt-4">
            [{projectMatch[1]}]
          </h3>
        );
        return;
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•')) {
        inList = true;
        const bulletContent = line.trim().substring(1).trim();
        
        // Process any bold text in the bullet
        let processedContent = bulletContent.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
        
        currentList.push(
          <li key={`li-${index}`} className="flex items-start">
            <span className="text-blue-400 mr-2 mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: processedContent }} />
          </li>
        );
        return;
      }
      
      // If we hit a non-bullet line, flush the list
      if (inList && line.trim() && !line.trim().startsWith('•')) {
        flushList();
      }
      
      // Handle bold text in regular lines
      let processedLine = line.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
      
      // Regular line
      if (line.trim()) {
        elements.push(
          <p key={`p-${index}`} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      }
    });
    
    // Flush any remaining list items
    flushList();
    
    return elements;
  };
  
  return <div className="message-formatted">{renderContent()}</div>;
}