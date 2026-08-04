import { sendPushNotification } from "@/lib/firebase/fcm";

export async function notifyRolesOnOperationAction(
  actorRole: string,
  actorName: string,
  actionType: 'CREATED' | 'UPDATED' | 'DELETED' | 'VALIDATED' | 'REJECTED' | 'CANCELLED' | 'SUSPENDED',
  operationDetails: { montant?: number, type: string, count?: number },
  url: string = "/dashboard"
) {
  let targetRoles: any[] = [];
  
  if (["AGENT", "CAISSIER", "CHEF_AGENCE", "COMPTABLE", "SECRETAIRE", "DGA"].includes(actorRole)) {
    // Si agent de saisie agit -> PDG et DG
    targetRoles = ["PDG", "DG"];
  } else if (actorRole === "DG") {
    // Si DG agit -> PDG
    targetRoles = ["PDG"];
  } else if (actorRole === "PDG") {
    // Si PDG agit, pas de notification Push à lui-même, sauf peut-être au DG pour info, 
    // mais la consigne dit: "par le DG qu'il signal au PDG", "agent declanche signal au DG et PDG".
    return;
  }

  if (targetRoles.length === 0) return;

  const actionText = {
    CREATED: "ajouté(e)",
    UPDATED: "modifié(e)",
    DELETED: "supprimé(e)",
    VALIDATED: "validé(e)",
    REJECTED: "rejeté(e)",
    CANCELLED: "annulé(e)",
    SUSPENDED: "suspendu(e)"
  }[actionType];

  let body = "";
  if (operationDetails.count && operationDetails.count > 1) {
    body = `${operationDetails.count} ${operationDetails.type.toLowerCase()}s ${actionText} par ${actorName}`;
  } else {
    const amountStr = operationDetails.montant ? ` de ${operationDetails.montant.toLocaleString('fr-FR')} FCFA` : "";
    body = `${operationDetails.type} ${amountStr} ${actionText} par ${actorName}`;
  }

  await sendPushNotification({
    title: `Alerte: ${operationDetails.type} ${actionText}`,
    body: body,
    eventType: `OPERATION_${actionType}`,
    url
  }, targetRoles);
}
