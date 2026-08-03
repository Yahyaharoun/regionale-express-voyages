"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export function ExportMenu() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      setIsExporting(format);
      
      if (format === 'pdf') {
        // Ouvrir directement dans un nouvel onglet pour impression PDF
        window.open(`/api/exports/operations?format=pdf`, '_blank');
        toast.success(`Export PDF généré avec succès.`);
        return;
      }

      const response = await fetch(`/api/exports/operations?format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'exportation");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Export_Operations_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Export ${format.toUpperCase()} réussi.`);
    } catch (error) {
      toast.error("Impossible de générer le fichier d'export.");
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={
        <Button variant="outline" size="sm" className="h-9 px-3 bg-background border-border/40 shadow-none hover:bg-muted/30">
          <Download className="h-3.5 w-3.5 mr-2" />
          Exporter
        </Button>
      } />
      <PopoverContent className="w-48 p-2" align="end">
        <div className="flex flex-col gap-1">
          <Button 
            variant="ghost" 
            className="justify-start text-sm h-9 px-2 font-normal" 
            onClick={() => handleExport("pdf")}
            disabled={isExporting !== null}
          >
            {isExporting === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4 text-red-500" />}
            Format PDF
          </Button>
          <Button 
            variant="ghost" 
            className="justify-start text-sm h-9 px-2 font-normal" 
            onClick={() => handleExport("excel")}
            disabled={isExporting !== null}
          >
            {isExporting === "excel" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />}
            Format Excel
          </Button>
          <Button 
            variant="ghost" 
            className="justify-start text-sm h-9 px-2 font-normal" 
            onClick={() => handleExport("csv")}
            disabled={isExporting !== null}
          >
            {isExporting === "csv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4 text-blue-500" />}
            Format CSV
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
