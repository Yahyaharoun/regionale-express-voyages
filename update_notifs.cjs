const fs = require('fs');
let code = fs.readFileSync('src/actions/operationActions.ts', 'utf8');

// Deposit
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "DEPOSIT_CREATED"[\s\S]*?\}, \["DG", "PDG"\], undefined, targetAgencyId\);/g, '');
code = code.replace(/revalidatePath\("\/dashboard\/deposits"\);/g, 'await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, "CREATED", { montant, type: "Versement" }, "/dashboard/deposits");\n\n    revalidatePath("/dashboard/deposits");');

// Recette
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "RECETTE_CREATED"[\s\S]*?\}, \["DG", "PDG"\], undefined, targetAgencyId\);/g, '');
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "TARGET_REACHED"[\s\S]*?\}, \["PDG", "DG"\], undefined, targetAgencyId\);/g, '');
code = code.replace(/revalidatePath\("\/dashboard\/recettes"\);/g, 'await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, "CREATED", { montant, type: "Recette" }, "/dashboard/recettes");\n\n    revalidatePath("/dashboard/recettes");');

// Update Expense
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "EXPENSE_UPDATED"[\s\S]*?\}, \["DG", "PDG"\], undefined, operation\.agencyId\);/g, '');
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "EXPENSE_VALIDATED"[\s\S]*?\}, \["PDG"\], undefined, operation\.agencyId\);/g, '');
// For update expense, revalidatePath("/dashboard/expenses") is present. But to be safe:
// It occurs twice now because of create. So I will replace the one in updateExpenseAction.
// Actually, using regex for specific replace is safer:
code = code.replace(/return \{ success: true, data: operation \};\s*\} catch \(error: any\) \{\s*console\.error\("Error updating expense/g, 'await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, "UPDATED", { montant: rawData.montant, type: "Opération" }, "/dashboard/expenses");\n\n    return { success: true, data: operation };\n  } catch (error: any) {\n    console.error("Error updating expense');

// Delete
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "OPERATION_DELETED"[\s\S]*?\}, \["DG", "PDG"\], undefined, existingOp\.agencyId\);/g, '');
code = code.replace(/const result = await OperationRepository\.delete\(id, user\.userId, dbUser\.role\);/, 'const result = await OperationRepository.delete(id, user.userId, dbUser.role);\n\n    await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, "DELETED", { montant: existingOp.montant, type: "Opération" }, "/dashboard");');

// Cancel
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "OPERATION_CANCELLED"[\s\S]*?\}, \["DG", "PDG"\], undefined, existingOp\.agencyId\);/g, '');
code = code.replace(/const result = await OperationRepository\.cancel\(id, user\.userId, dbUser\.role\);/, 'const result = await OperationRepository.cancel(id, user.userId, dbUser.role);\n\n    await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, "CANCELLED", { montant: existingOp.montant, type: "Opération" }, "/dashboard");');

// Validate/Reject
code = code.replace(/await sendPushNotification\(\{[\s\S]*?eventType: "OPERATION_VALIDATED"[\s\S]*?\}, \["PDG"\], undefined, existingOp\.agencyId\);/g, '');
code = code.replace(/const result = await OperationRepository\.updateStatus\(id, statut, user\.userId, dbUser\.role\);/, 'const result = await OperationRepository.updateStatus(id, statut, user.userId, dbUser.role);\n\n    await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, statut === "VALIDEE" ? "VALIDATED" : "REJECTED", { montant: existingOp.montant, type: "Opération" }, "/dashboard");');

fs.writeFileSync('src/actions/operationActions.ts', code);
console.log('Done replacement');
