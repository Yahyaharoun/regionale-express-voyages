import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { OperationRepository } from "@/repositories/operationRepository";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return new NextResponse("Utilisateur introuvable", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "excel";

    // Récupérer les opérations (PDG/DG/DGA voient tout, les autres voient leur agence)
    let operations = [];
    if (['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
       operations = await prisma.operation.findMany({
         orderBy: { createdAt: 'desc' },
         include: { category: true, agent: true, agency: true }
       });
    } else if (dbUser.agencyId) {
       operations = await prisma.operation.findMany({
         where: { agencyId: dbUser.agencyId },
         orderBy: { createdAt: 'desc' },
         include: { category: true, agent: true, agency: true }
       });
    } else {
      return new NextResponse("Agence non assignée", { status: 403 });
    }

    // VULN-008: Historisation de la lecture des données
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        role: dbUser.role,
        action: 'EXPORT_DATA',
        tableName: 'Operation',
        recordId: 'ALL',
        oldData: { format }
      }
    });

    if (format === "excel" || format === "csv") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Opérations");

      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Type", key: "type", width: 15 },
        { header: "Motif", key: "motif", width: 30 },
        { header: "Catégorie", key: "categorie", width: 20 },
        { header: "Montant (FCFA)", key: "montant", width: 15 },
        { header: "Statut", key: "statut", width: 15 },
        { header: "Créé par", key: "agent", width: 25 },
        { header: "Agence", key: "agence", width: 20 },
      ];

      worksheet.getRow(1).font = { bold: true };
      
      operations.forEach((op: any) => {
        worksheet.addRow({
          date: new Date(op.createdAt).toLocaleDateString("fr-FR"),
          type: op.type === 'VERSEMENT' ? 'VERSEMENT BANCAIRE' : op.type,
          motif: op.commentaire || "",
          categorie: op.category?.nom || "",
          montant: op.montant,
          statut: op.statut,
          agent: op.agent ? `${op.agent.prenom} ${op.agent.nom}` : "",
          agence: op.agency?.nom || "",
        });
      });

      if (format === "csv") {
        const buffer = await workbook.csv.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="operations.csv"',
          },
        });
      } else {
        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="operations.xlsx"',
          },
        });
      }
    } else if (format === "pdf") {
      // Pour une version PDF simple, on peut générer un HTML et le transformer ou utiliser une lib
      // Ici nous allons renvoyer un PDF basique ou un HTML structuré formaté pour impression
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Export des Opérations</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { color: #0B8F3A; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f7f7; color: #1b1b1b; }
            .amount { text-align: right; font-weight: bold; }
            .type-depense { color: #e11d48; }
            .type-versement { color: #10b981; }
            .type-recette { color: #3b82f6; }
          </style>
        </head>
        <body onload="window.print()">
          <h1>REGIONALE EXPRESS VOYAGES SARL</h1>
          <h2>Rapport des Opérations Financières</h2>
          <p>Généré le : ${new Date().toLocaleString("fr-FR")}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Motif</th>
                <th>Catégorie</th>
                <th>Montant (FCFA)</th>
                <th>Statut</th>
                <th>Agence</th>
              </tr>
            </thead>
            <tbody>
              ${operations.map((op: any) => `
                <tr>
                  <td>${new Date(op.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td class="${op.type === 'DEPENSE' ? 'type-depense' : op.type === 'RECETTE' ? 'type-recette' : 'type-versement'}">${op.type === 'VERSEMENT' ? 'VERSEMENT BANCAIRE' : op.type}</td>
                  <td>${op.commentaire || ''}</td>
                  <td>${op.category?.nom || ''}</td>
                  <td class="amount">${op.montant.toLocaleString('fr-FR')}</td>
                  <td>${op.statut.replace('_', ' ')}</td>
                  <td>${op.agency?.nom || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Return HTML that auto-prints as PDF fallback for simple requirements
      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return new NextResponse("Format non supporté", { status: 400 });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}
