"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatToMillions } from "@/lib/formatters";

interface AIStatCardProps {
  content: string;
}

export function AIStatCard({ content }: AIStatCardProps) {
  // Regex to extract Label and Value. e.g "**Revenus :** 5000 FCFA"
  // or "Dépenses: **2000**"
  const match = content.match(/^(?:\*\*|__)?([^\*\_]+)(?:\*\*|__)?\s*:\s*(?:\*\*|__)?([0-9\s]+(?:FCFA|CFA|%)?)(?:\*\*|__)?$/i);
  
  if (!match) {
    return <div className="text-foreground my-2">{content}</div>;
  }

  const label = match[1].trim();
  const rawValue = match[2].trim();
  
  // Try to format large numbers if it's FCFA
  let displayValue = rawValue;
  const numValue = parseInt(rawValue.replace(/\s/g, '').replace(/FCFA|CFA/i, ''));
  if (!isNaN(numValue) && (rawValue.toUpperCase().includes('FCFA') || rawValue.toUpperCase().includes('CFA'))) {
    if (numValue >= 1000000) {
      displayValue = formatToMillions(numValue);
    } else {
      displayValue = numValue.toLocaleString('fr-FR') + ' FCFA';
    }
  }

  return (
    <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl my-3 inline-block mr-3 min-w-[200px]">
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <div className="text-2xl font-bold tracking-tight text-emerald-600">
          {displayValue}
        </div>
      </CardContent>
    </Card>
  );
}
