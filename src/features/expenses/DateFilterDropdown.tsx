"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

const options = [
  { value: "all", label: "Toutes les dates" },
  { value: "jour", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "mois", label: "Ce mois" },
  { value: "annee", label: "Cette année" }
];

export function DateFilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentRange = searchParams.get("range") || "all";
  const currentLabel = options.find(o => o.value === currentRange)?.label || "Ce mois";

  const handleSelect = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val === "all") {
      params.delete("range");
    } else {
      params.set("range", val);
    }
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={
        <Button variant="outline" size="sm" className="h-9 px-3 bg-background flex-1 sm:flex-none border-border/40 shadow-none hover:bg-muted/30 text-xs font-semibold flex items-center justify-between min-w-[120px]">
          <span className="flex items-center">
            <Calendar className="mr-2 h-3.5 w-3.5" />
            {currentLabel}
          </span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              className={`justify-start text-xs font-normal h-8 ${currentRange === opt.value ? 'bg-muted font-medium' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
