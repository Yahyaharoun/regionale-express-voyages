import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNetEnCaisse } from "@/lib/netEnCaisse";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function SyntheseJournaliere() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateRange = { startDate: today, endDate: tomorrow };

  const agencies = await prisma.agency.findMany();
  
  const ligne1Agencies = agencies.filter(a => a.nom.toLowerCase().includes("mbalmayo") || a.nom.toLowerCase().includes("mvan"));
  const ligne2Agencies = agencies.filter(a => a.nom.toLowerCase().includes("mimboman") || a.nom.toLowerCase().includes("ayos") || a.nom.toLowerCase().includes("akonolinga"));

  // Fetch for LIGNE 1
  const ligne1Stats = await Promise.all(
    ligne1Agencies.map(async (agency) => {
      const stats = await getNetEnCaisse(agency.id, dateRange);
      return { agency, stats };
    })
  );

  const totalLigne1 = ligne1Stats.reduce((acc, curr) => acc + curr.stats.recettesBrutes, 0);
  const depensesLigne1 = ligne1Stats.reduce((acc, curr) => acc + curr.stats.totalDepenses, 0);
  const netLigne1 = totalLigne1 - depensesLigne1;

  // Fetch for LIGNE 2
  const ligne2Stats = await Promise.all(
    ligne2Agencies.map(async (agency) => {
      const stats = await getNetEnCaisse(agency.id, dateRange);
      return { agency, stats };
    })
  );

  const totalLigne2 = ligne2Stats.reduce((acc, curr) => acc + curr.stats.recettesBrutes, 0);
  const depensesLigne2 = ligne2Stats.reduce((acc, curr) => acc + curr.stats.totalDepenses, 0);
  const netLigne2 = totalLigne2 - depensesLigne2;

  // Global
  const totalGlobal = totalLigne1 + totalLigne2;
  const depensesGlobales = depensesLigne1 + depensesLigne2;
  const netGlobal = netLigne1 + netLigne2;

  return (
    <Card className="mb-6 border-emerald-500/20 bg-emerald-50/10">
      <CardHeader className="pb-2 border-b border-emerald-500/10">
        <CardTitle className="text-lg font-bold text-emerald-800">
          Synthèse du {format(today, "d MMMM yyyy", { locale: fr })}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid md:grid-cols-3 gap-6">
        
        {/* LIGNE 1 */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-700 border-b pb-1">LIGNE 1</h3>
          {ligne1Stats.map(({ agency, stats }) => (
            <div key={agency.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{agency.nom}</span>
              <span className="font-medium text-emerald-600">{stats.recettesBrutes.toLocaleString('fr-FR')} F</span>
            </div>
          ))}
          <div className="pt-2 border-t mt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Ligne 1</span>
              <span>{totalLigne1.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between text-sm text-red-500">
              <span>Dépenses</span>
              <span>- {depensesLigne1.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-emerald-700 mt-1">
              <span>Net en Caisse</span>
              <span>{netLigne1.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        </div>

        {/* LIGNE 2 */}
        <div className="space-y-3 md:border-l md:pl-6">
          <h3 className="font-bold text-slate-700 border-b pb-1">LIGNE 2</h3>
          {ligne2Stats.map(({ agency, stats }) => (
            <div key={agency.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{agency.nom}</span>
              <span className="font-medium text-emerald-600">{stats.recettesBrutes.toLocaleString('fr-FR')} F</span>
            </div>
          ))}
          <div className="pt-2 border-t mt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Ligne 2</span>
              <span>{totalLigne2.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between text-sm text-red-500">
              <span>Dépenses</span>
              <span>- {depensesLigne2.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-emerald-700 mt-1">
              <span>Net en Caisse</span>
              <span>{netLigne2.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        </div>

        {/* SYNTHÈSE GLOBALE */}
        <div className="space-y-3 md:border-l md:pl-6 bg-emerald-100/30 p-3 rounded-xl border border-emerald-200/50">
          <h3 className="font-bold text-emerald-900 border-b border-emerald-200 pb-1">SYNTHÈSE GLOBALE</h3>
          <div className="flex justify-between text-sm font-semibold text-emerald-800 pt-2">
            <span>Recette Brute</span>
            <span>{totalGlobal.toLocaleString('fr-FR')} F</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-red-600">
            <span>Toutes les Dépenses</span>
            <span>- {depensesGlobales.toLocaleString('fr-FR')} F</span>
          </div>
          <div className="flex justify-between text-lg font-black text-emerald-700 mt-2 pt-2 border-t border-emerald-200">
            <span>NET GLOBAL</span>
            <span>{netGlobal.toLocaleString('fr-FR')} F</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
