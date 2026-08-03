"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";

interface AICodeBlockProps {
  content: string;
  lang?: string;
}

export function AICodeBlock({ content, lang }: AICodeBlockProps) {
  const { isCopied, copyToClipboard } = useCopy();

  return (
    <div className="relative group rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 my-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">{lang || 'text'}</span>
        <button
          onClick={() => copyToClipboard(content)}
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono text-zinc-100 leading-relaxed">
        <pre><code>{content}</code></pre>
      </div>
    </div>
  );
}
