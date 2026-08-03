import { parse, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export function extractDateRange(text: string, context?: { from?: string, to?: string }): DateRange {
  const now = new Date();
  const lowerText = text.toLowerCase();

  // "aujourd'hui"
  if (lowerText.includes("aujourd'hui") || lowerText.includes("jour")) {
    return { startDate: startOfDay(now), endDate: endOfDay(now), label: "Aujourd'hui" };
  }
  // "hier"
  if (lowerText.includes("hier")) {
    const yesterday = subDays(now, 1);
    return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday), label: "Hier" };
  }
  // "cette semaine"
  if (lowerText.includes("cette semaine")) {
    return { startDate: startOfWeek(now, { locale: fr }), endDate: endOfWeek(now, { locale: fr }), label: "Cette semaine" };
  }
  // "ce mois" / "du mois"
  if (lowerText.includes("ce mois") || lowerText.includes("du mois")) {
    return { startDate: startOfMonth(now), endDate: endOfMonth(now), label: "Ce mois" };
  }
  // "le mois dernier"
  if (lowerText.includes("mois dernier")) {
    const lastMonth = subMonths(now, 1);
    return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth), label: "Mois dernier" };
  }
  // "cette année" / "cette annee" / "annuel"
  if (lowerText.includes("cette année") || lowerText.includes("cette annee") || lowerText.includes("annuel")) {
    return { startDate: startOfYear(now), endDate: endOfYear(now), label: "Cette année" };
  }
  // "année dernière" / "annee derniere"
  if (lowerText.includes("année dernière") || lowerText.includes("annee derniere")) {
    const lastYear = subYears(now, 1);
    return { startDate: startOfYear(lastYear), endDate: endOfYear(lastYear), label: "L'année dernière" };
  }
  
  // Regex for "DD/MM/YYYY"
  const dateSlashRegex = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  let slashMatches = [...lowerText.matchAll(dateSlashRegex)];
  if (slashMatches.length >= 1) {
    const day = parseInt(slashMatches[0][1]);
    const month = parseInt(slashMatches[0][2]) - 1;
    const year = parseInt(slashMatches[0][3]);
    const d = new Date(year, month, day);
    if (isValid(d)) {
      return { startDate: startOfDay(d), endDate: endOfDay(d), label: `Le ${slashMatches[0][0]}` };
    }
  }

  // Specific date parsing "15 juillet 2026" or "18 juillet"
  // Regex for "DD mois YYYY" or "DD mois"
  const dateRegex = /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?\b/gi;
  let matches = [...lowerText.matchAll(dateRegex)];
  
  if (matches.length === 2 && lowerText.includes("entre") && lowerText.includes("et")) {
    // Range between two dates
    const d1 = parseDateMatch(matches[0]);
    const d2 = parseDateMatch(matches[1]);
    if (d1 && d2) {
      return { 
        startDate: startOfDay(d1 < d2 ? d1 : d2), 
        endDate: endOfDay(d1 > d2 ? d1 : d2), 
        label: `Entre ${matches[0][0]} et ${matches[1][0]}` 
      };
    }
  } else if (matches.length === 2 && lowerText.includes("du") && lowerText.includes("au")) {
    // Range from X to Y
    const d1 = parseDateMatch(matches[0]);
    const d2 = parseDateMatch(matches[1]);
    if (d1 && d2) {
      return { 
        startDate: startOfDay(d1 < d2 ? d1 : d2), 
        endDate: endOfDay(d1 > d2 ? d1 : d2), 
        label: `Du ${matches[0][0]} au ${matches[1][0]}` 
      };
    }
  } else if (matches.length >= 1) {
    // Single specific date
    const d = parseDateMatch(matches[0]);
    if (d) {
      return { startDate: startOfDay(d), endDate: endOfDay(d), label: `Le ${matches[0][0]}` };
    }
  } else {
    // Check for just a month (e.g. "mois de mars", "en mars 2026")
    const monthRegex = /\b(?:mois de |en )?(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(\d{4}))?\b/i;
    const monthMatch = lowerText.match(monthRegex);
    if (monthMatch) {
      const mStr = monthMatch[1];
      const yStr = monthMatch[2] || new Date().getFullYear().toString();
      const monthIndex = parseInt(mapMonth(mStr)) - 1;
      const d = new Date(parseInt(yStr), monthIndex, 1);
      if (isValid(d)) {
        return { startDate: startOfMonth(d), endDate: endOfMonth(d), label: `Mois de ${mStr} ${yStr}` };
      }
    }
  }

  // Default: Use context if provided
  if (context?.from && context?.to) {
    return {
      startDate: startOfDay(new Date(context.from)),
      endDate: endOfDay(new Date(context.to)),
      label: "Période du Dashboard"
    };
  }

  return { startDate: new Date(0), endDate: new Date(now.getFullYear() + 10, 0, 1), label: "Général" };
}

function parseDateMatch(match: RegExpMatchArray): Date | null {
  const day = match[1];
  const month = mapMonth(match[2]);
  const year = match[3] || new Date().getFullYear().toString();
  
  const parsed = parse(`${day} ${month} ${year}`, 'dd MM yyyy', new Date(), { locale: fr });
  if (isValid(parsed)) return parsed;
  return null;
}

function mapMonth(monthStr: string): string {
  const map: Record<string, string> = {
    'janvier': '01', 'février': '02', 'fevrier': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08', 'aout': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12', 'decembre': '12'
  };
  return map[monthStr.toLowerCase()] || '01';
}

export function extractBank(text: string): string | null {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('afriland')) return 'afriland';
  if (lowerText.includes('uba')) return 'uba';
  if (lowerText.includes('bicec')) return 'bicec';
  if (lowerText.includes('sg') || lowerText.includes('société générale') || lowerText.includes('societe generale')) return 'sg';
  return null;
}

export function extractAgency(text: string): string | null {
  const lowerText = text.toLowerCase();
  const agencies = ['mbalmayo', 'mvan', 'mimboman', 'ayos', 'akonolinga'];
  for (const ag of agencies) {
    if (lowerText.includes(ag)) return ag;
  }
  return null;
}
