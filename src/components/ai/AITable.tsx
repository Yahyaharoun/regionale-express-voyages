"use client";

interface AITableProps {
  content: string;
}

export function AITable({ content }: AITableProps) {
  const lines = content.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 2) return null;

  const extractCells = (line: string) => {
    return line.split('|').slice(1, -1).map(c => c.trim());
  };

  const headers = extractCells(lines[0]);
  const rows = lines.slice(2).map(extractCells);

  return (
    <div className="w-full overflow-x-auto my-4 rounded-xl border border-border/50 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/30 text-muted-foreground uppercase text-xs font-semibold">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 border-b border-border/50 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30 bg-background">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/10 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 whitespace-nowrap text-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
