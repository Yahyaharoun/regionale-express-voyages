"use client";

import { useMemo } from "react";
import { parseMarkdown, AIBlock } from "@/lib/markdownParser";
import { AICodeBlock } from "./AICodeBlock";
import { AITable } from "./AITable";
import { AIStatCard } from "./AIStatCard";

interface AIResponseProps {
  content: string;
}

export function AIResponse({ content }: AIResponseProps) {
  // Parse markdown exactly once per content change
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="w-full space-y-3 font-sans text-sm text-foreground">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: AIBlock }) {
  switch (block.type) {
    case 'header':
      const level = block.metadata?.level || 3;
      if (level === 1) return <h1 className="text-xl font-bold tracking-tight mt-6 mb-3 text-foreground">{block.content}</h1>;
      if (level === 2) return <h2 className="text-lg font-bold tracking-tight mt-5 mb-2 text-foreground">{block.content}</h2>;
      return <h3 className="text-base font-semibold tracking-tight mt-4 mb-2 text-zinc-800 dark:text-zinc-200">{block.content}</h3>;
    
    case 'code':
      return <AICodeBlock content={block.content} lang={block.metadata?.lang} />;
    
    case 'table':
      return <AITable content={block.content} />;
    
    case 'stat':
      return <AIStatCard content={block.content} />;
      
    case 'list':
      const items = block.content.split('\n');
      return (
        <ul className="list-disc pl-5 space-y-1.5 my-3 text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item.replace(/^[*-]\s+/, '').replace(/^\d+\.\s+/, '')}
            </li>
          ))}
        </ul>
      );
      
    case 'text':
    default:
      // Handle bold formatting natively for simple text
      const renderText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') || part.startsWith('__')) {
            return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
          }
          return <span key={i}>{part}</span>;
        });
      };
      
      return (
        <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {renderText(block.content)}
        </p>
      );
  }
}
