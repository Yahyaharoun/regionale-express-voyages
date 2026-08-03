import { getDettesFournisseurs } from "@/actions/detteActions";
import { DettesView } from "@/features/fournisseurs/DettesView";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dettes Fournisseurs | REGIONALE EXPRESS VOYAGES SARL",
};

export default async function DettesFournisseursPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'PDG' && user.role !== 'DG')) {
    redirect("/dashboard");
  }

  const res = await getDettesFournisseurs();
  const dettes = res.data || [];

  return (
    <div className="mx-auto space-y-6 pb-20 md:pb-0">
      <DettesView dettes={dettes} />
    </div>
  );
}
