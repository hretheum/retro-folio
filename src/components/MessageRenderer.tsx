import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MessageRendererProps {
  content: string;
  onPromptClick: (prompt: string) => void;
}

export function MessageRenderer({ content, onPromptClick }: MessageRendererProps) {
  // Parse the content to handle markdown and special button syntax
  const renderContent = () => {
    // Split content by lines to process each part
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      // Handle button prompts: <button-prompt="Project Name">Tell me more →</button-prompt>
      const buttonMatch = line.match(/<button-prompt="([^"]+)">([^<]+)<\/button-prompt>/);
      if (buttonMatch) {
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
      
      // Handle bold text: **[Projekt: Name]**
      let processedLine = line.replace(/\*\*\[([^\]]+)\]\*\*/g, '<strong class="text-blue-400 text-lg">[$1]</strong>');
      processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      
      // Handle bullet points
      if (line.trim().startsWith('•')) {
        elements.push(
          <li key={`li-${index}`} className="ml-4 mb-1" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
        return;
      }
      
      // Regular line
      if (line.trim()) {
        elements.push(
          <div key={`line-${index}`} className="mb-2" dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      }
    });
    
    return elements;
  };
  
  return <div className="message-formatted">{renderContent()}</div>;
}