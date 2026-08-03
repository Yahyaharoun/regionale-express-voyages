import { SyntheseLignesView } from "@/features/synthese/SyntheseLignesView";

export const metadata = {
  title: "Synthèse Journalière des Lignes | REGIONALE EXPRESS VOYAGES SARL",
  description: "Vue d'ensemble et synthèse financière automatique par ligne",
};

export default function SyntheseLignesPage() {
  return (
    <div className="mx-auto space-y-6 pb-20 md:pb-0">
      <SyntheseLignesView />
    </div>
  );
}
