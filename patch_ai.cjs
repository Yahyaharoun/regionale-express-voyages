const fs = require('fs');

const file = 'src/features/ai/aiRouter.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'Total des versements',
  'Total des versements bancaires'
);
content = content.replace(
  'Total Versements',
  'Total Versements bancaires'
);
content = content.replace(
  'versements',
  'versements bancaires'
);

const newLogic = `
      if (msg.includes("dépensé") || msg.includes("depense")) {
        reply = \`💸 **Total des dépenses (\${dateRange.label}) :** \${stats.expenseMonth.toLocaleString('fr-FR')} FCFA\\n\`;
      } else if (msg.includes("recette")) {
        reply = \`📈 **Total des recettes journalières (\${dateRange.label}) :** \${stats.totalRecettes?.toLocaleString('fr-FR') || 0} FCFA\\n\`;
      } else if (msg.includes("versement")) {
        reply = \`💰 **Total des versements bancaires (\${dateRange.label}) :** \${stats.totalDeposits.toLocaleString('fr-FR')} FCFA\\n\`;
      } else {
        reply += \`- **Total Recettes :** \${stats.totalRecettes?.toLocaleString('fr-FR') || 0} FCFA\\n\`;
        reply += \`- **Total Dépenses :** \${stats.expenseMonth.toLocaleString('fr-FR')} FCFA\\n\`;
        reply += \`- **Total Versements bancaires :** \${stats.totalDeposits.toLocaleString('fr-FR')} FCFA\\n\`;
        reply += \`- **Solde Théorique :** \${stats.theoreticalBalance.toLocaleString('fr-FR')} FCFA\\n\`;
      }
`;

content = content.replace(
  /if \(msg\.includes\("dépensé"\) \|\| msg\.includes\("depense"\)\) \{[\s\S]*?\}\n/,
  newLogic
);

// We need to also add "recette" to line 76:
content = content.replace(
  /msg\.includes\("versement"\)/,
  'msg.includes("versement") || msg.includes("recette")'
);

// We need to update `generateComprehensiveBilan` manually if it hardcodes the word 'versement'.
content = content.replace(
  /Versements\b/g,
  'Versements bancaires'
);
content = content.replace(
  /versement\b/g,
  'versement bancaire'
);
content = content.replace(
  /versement bancaires/g,
  'versements bancaires'
);
content = content.replace(
  /versements bancaires bancaires/g,
  'versements bancaires'
);
content = content.replace(
  /Versement bancaire bancaire/g,
  'Versement bancaire'
);
content = content.replace(
  /Versement bancaires/g,
  'Versements bancaires'
);

content = content.replace(
  /totalDeposits/g,
  'totalDeposits'
); // Doesn't do anything but wait, in `generateComprehensiveBilan`, let's just make it output Recettes.

content = content.replace(
  /\*\*(Versements bancaires)\*\*: \${stats.totalDeposits/g,
  '**Recettes**: ${stats.totalRecettes?.toLocaleString(\'fr-FR\') || 0} FCFA\\n- **Versements bancaires**: ${stats.totalDeposits'
);

fs.writeFileSync(file, content);
