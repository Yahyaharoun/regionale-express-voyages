const fs = require('fs');
let content = fs.readFileSync('src/actions/operationActions.ts', 'utf8');

// Replace 1: createRecetteAction
content = content.replace(
`        await sendPushNotification({
           title: rawData.statut === "VALIDEE" ? "Nouvelle Recette" : "Nouvelle Recette à valider",
           body: \`Recette de \${montant.toLocaleString('fr-FR')} FCFA soumise par \${dbUser.prenom} \${dbUser.nom}\`,
           eventType: "RECETTE_CREATED",
           url: "/dashboard/recettes"
        }, ["DG", "PDG"], undefined, targetAgencyId);`,
'');

// Replace 2: updateExpenseAction (delete the sendPushNotification calls)
content = content.replace(
`        await sendPushNotification({
           title: "Dépense modifiée",
           body: \`La dépense a été modifiée par \${dbUser.prenom} \${dbUser.nom}\`,
           eventType: "EXPENSE_UPDATED",
           url: "/dashboard/expenses"
        }, ["DG", "PDG"], undefined, operation.agencyId);`,
'await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, "UPDATED", { type: "Dépense" }, "/dashboard/expenses");');

content = content.replace(
`        await sendPushNotification({
           title: "Dépense validée (Modification)",
           body: \`La dépense modifiée par \${dbUser.prenom} \${dbUser.nom} a été validée automatiquement\`,
           eventType: "EXPENSE_VALIDATED",
           url: "/dashboard/expenses"
        }, ["PDG"], undefined, operation.agencyId);`,
'');

// Replace 3: deleteOperationAction
content = content.replace(
`      await sendPushNotification({
         title: \`\${typeLabel} supprimé(e)\`,
         body: \`Montant : \${existingOp.montant.toLocaleString('fr-FR')} FCFA supprimé par \${dbUser.prenom} \${dbUser.nom}\`,
         eventType: "OPERATION_DELETED",
         url: "/dashboard"
      }, ["DG", "PDG"], undefined, existingOp.agencyId);`,
'');
content = content.replace(
`const result = await OperationRepository.delete(id, user.userId, dbUser.role);`,
`const result = await OperationRepository.delete(id, user.userId, dbUser.role);\n    await notifyRolesOnOperationAction(dbUser.role, \`\${dbUser.prenom} \${dbUser.nom}\`, "DELETED", { montant: existingOp.montant, type: "Opération" }, "/dashboard");`);

// Replace 4: cancelOperationAction
content = content.replace(
`      await sendPushNotification({
         title: \`\${typeLabel} annulé(e)\`,
         body: \`Montant : \${existingOp.montant.toLocaleString('fr-FR')} FCFA annulé par \${dbUser.prenom} \${dbUser.nom}\`,
         eventType: "OPERATION_CANCELLED",
         url: "/dashboard"
      }, ["DG", "PDG"], undefined, existingOp.agencyId);`,
'');
content = content.replace(
`const result = await OperationRepository.cancel(id, user.userId, dbUser.role);`,
`const result = await OperationRepository.cancel(id, user.userId, dbUser.role);\n    await notifyRolesOnOperationAction(dbUser.role, \`\${dbUser.prenom} \${dbUser.nom}\`, "CANCELLED", { montant: existingOp.montant, type: "Opération" }, "/dashboard");`);


// Replace 5: validateOperationAction
content = content.replace(
`        await sendPushNotification({
           title: \`\${typeLabel} validé(e)\`,
           body: \`Par \${dbUser.prenom} \${dbUser.nom}. Montant: \${op.montant.toLocaleString('fr-FR')} FCFA\`,
           eventType: "OPERATION_VALIDATED_PDG",
           url: "/dashboard"
        }, ["PDG"]);`,
`        await notifyRolesOnOperationAction(dbUser.role, \`\${dbUser.prenom} \${dbUser.nom}\`, "VALIDATED", { montant: op.montant, type: typeLabel }, "/dashboard");`);

fs.writeFileSync('src/actions/operationActions.ts', content);
console.log("Done");
