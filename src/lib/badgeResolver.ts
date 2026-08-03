export type BadgeType = 
  | 'BROUILLON' | 'EN ATTENTE' | 'VALIDÉ' | 'REJETÉ' 
  | 'ANNULÉ' | 'SUSPENDU' | 'ACTIF' | 'INACTIF' 
  | 'OBJECTIF ATTEINT' | 'OBJECTIF EN COURS' | 'OBJECTIF NON ATTEINT'
  | 'DEFAULT';

export const resolveBadge = (text: string): { type: BadgeType, colorClass: string, icon?: string } => {
  const upper = text.toUpperCase().trim();
  
  if (upper.includes('BROUILLON')) return { type: 'BROUILLON', colorClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (upper.includes('EN ATTENTE')) return { type: 'EN ATTENTE', colorClass: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (upper.includes('VALIDÉ') || upper.includes('APPROUVÉ')) return { type: 'VALIDÉ', colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (upper.includes('REJETÉ') || upper.includes('NON ATTEINT') || upper.includes('ÉCHEC')) return { type: 'REJETÉ', colorClass: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (upper.includes('ANNULÉ') || upper.includes('SUSPENDU')) return { type: 'ANNULÉ', colorClass: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
  if (upper.includes('ACTIF') || upper.includes('ATTEINT')) return { type: 'ACTIF', colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (upper.includes('INACTIF')) return { type: 'INACTIF', colorClass: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
  if (upper.includes('EN COURS')) return { type: 'OBJECTIF EN COURS', colorClass: 'bg-blue-100 text-blue-700 border-blue-200' };

  return { type: 'DEFAULT', colorClass: 'bg-muted text-muted-foreground border-border' };
};
