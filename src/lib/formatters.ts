export function formatToMillions(amount: number): string {
  if (amount === 0) return "0 FCFA";
  const inMillions = amount / 1000000;
  
  // Si c'est moins d'un million, on affiche la valeur normale
  if (Math.abs(amount) < 1000000 && Math.abs(amount) > 0) {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  }

  // Format the number to keep decimals if necessary
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(inMillions);

  return `${formatted} M FCFA`;
}

export function formatYAxis(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(0)} M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)} K`;
  }
  return `${value}`;
}

export function formatCurrencyAxis(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(0)} M`;
  }
  // Pour les valeurs en dessous d'un million, on affiche la devise
  return `${value.toLocaleString('fr-FR')} FCFA`;
}
