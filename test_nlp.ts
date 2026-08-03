import { extractDateRange } from './src/features/ai/nlpParser';

const testStrs = [
  "Bilan du 31/07/2026",
  "Bilan d'aujourd'hui",
  "Bilan de cette semaine",
  "Bilan du mois",
  "Bilan annuel"
];

testStrs.forEach(s => {
  const range = extractDateRange(s);
  console.log(`"${s}" => ${range.label}: ${range.startDate.toISOString()} - ${range.endDate.toISOString()}`);
});
