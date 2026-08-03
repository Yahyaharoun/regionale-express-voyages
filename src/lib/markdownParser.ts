export type AIBlockType = 'text' | 'header' | 'list' | 'code' | 'table' | 'stat';

export interface AIBlock {
  id: string;
  type: AIBlockType;
  content: string;
  metadata?: any;
}

export function parseMarkdown(text: string): AIBlock[] {
  const blocks: AIBlock[] = [];
  const lines = text.split('\n');
  let currentBlock: AIBlock | null = null;
  let inCode = false;
  let inTable = false;
  let inList = false;

  const pushCurrent = () => {
    if (currentBlock) {
      currentBlock.content = currentBlock.content.trim();
      if (currentBlock.content) {
        // Detect if a text block is actually a stat (e.g. "**Revenus :** 1000 FCFA")
        if (currentBlock.type === 'text' && isStatBlock(currentBlock.content)) {
          currentBlock.type = 'stat';
        }
        blocks.push({ ...currentBlock });
      }
      currentBlock = null;
    }
  };

  const isStatBlock = (str: string) => {
    return /^(\*\*|__)[^\*\_]+(\*\*|__)\s*:\s*[0-9\s]+(?:FCFA|CFA|%)?$/i.test(str.trim()) ||
           /^[^\:]+\s*:\s*\*\*?[0-9\s]+(?:FCFA|CFA|%)?\*\*?$/i.test(str.trim());
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCode) {
        if (currentBlock) currentBlock.content += '\n' + line;
        pushCurrent();
        inCode = false;
      } else {
        pushCurrent();
        const lang = trimmed.slice(3).trim();
        currentBlock = { id: crypto.randomUUID(), type: 'code', content: '', metadata: { lang } };
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      currentBlock!.content += (currentBlock!.content ? '\n' : '') + line;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
      pushCurrent();
      blocks.push({
        id: crypto.randomUUID(),
        type: 'header',
        content: headerMatch[2],
        metadata: { level: headerMatch[1].length }
      });
      continue;
    }

    // Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!inTable) {
        pushCurrent();
        currentBlock = { id: crypto.randomUUID(), type: 'table', content: line };
        inTable = true;
      } else {
        currentBlock!.content += '\n' + line;
      }
      continue;
    } else if (inTable) {
      pushCurrent();
      inTable = false;
    }

    // Lists
    const isListItem = /^[*-]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
    if (isListItem) {
      if (!inList) {
        pushCurrent();
        currentBlock = { id: crypto.randomUUID(), type: 'list', content: line };
        inList = true;
      } else {
        currentBlock!.content += '\n' + line;
      }
      continue;
    } else if (inList && trimmed === '') {
      pushCurrent();
      inList = false;
      continue;
    } else if (inList) {
      // Multiline list item
      currentBlock!.content += '\n' + line;
      continue;
    }

    // Empty lines separate text blocks
    if (trimmed === '') {
      pushCurrent();
      continue;
    }

    // Normal Text
    if (!currentBlock || currentBlock.type !== 'text') {
      pushCurrent();
      currentBlock = { id: crypto.randomUUID(), type: 'text', content: line };
    } else {
      currentBlock.content += '\n' + line;
    }
  }

  pushCurrent();
  return blocks;
}
