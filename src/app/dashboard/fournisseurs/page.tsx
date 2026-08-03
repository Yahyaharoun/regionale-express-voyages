import { getFournisseurs } from "@/actions/fournisseurActions";
import { FournisseursView } from "@/features/fournisseurs/FournisseursView";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAgentRole } from "@/lib/netEnCaisse";

export const metadata = {
  title: "Fournisseurs | REGIONALE EXPRESS VOYAGES SARL",
};

export default async function FournisseursPage() {
  const user = await getCurrentUser();
  if (!user || isAgentRole(user.role)) {
    redirect("/dashboard");
  }
  const res = await getFournisseurs();
  const fournisseurs = res.data || [];

  return (
    <div className="mx-auto space-y-6 pb-20 md:pb-0">
      <FournisseursView initialFournisseurs={fournisseurs} userRole={user?.role} />
    </div>
  );
}
