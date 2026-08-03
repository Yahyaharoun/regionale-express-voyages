const fs = require('fs');

const files = [
  'src/app/dashboard/deposits/page.tsx',
  'src/app/dashboard/deposits/new/page.tsx',
  'src/app/dashboard/deposits/[id]/edit/page.tsx',
  'src/app/dashboard/expenses/page.tsx',
  'src/app/tv/TVDashboardClient.tsx',
  'src/app/dashboard/components/PDGDashboard.tsx',
  'src/app/dashboard/components/AgentDashboard.tsx',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace standalone Versement(s) with Versements bancaires where appropriate
    content = content.replace(/Nouveau Versement/g, 'Nouveau Versement bancaire');
    content = content.replace(/>Versements</g, '>Versements bancaires<');
    content = content.replace(/Dépenses & Versements/g, 'Dépenses & Versements bancaires');
    content = content.replace(/Modifier Versement/g, 'Modifier le Versement bancaire');
    content = content.replace(/Modifier le Versement/g, 'Modifier le Versement bancaire');
    content = content.replace(/Détails du versement/g, 'Détails du versement bancaire');
    content = content.replace(/Versements récents/g, 'Versements bancaires récents');
    content = content.replace(/historique des versements/gi, 'historique des versements bancaires');
    content = content.replace(/aucun versement/gi, 'aucun versement bancaire');
    content = content.replace(/Total Versements/g, 'Total Versements bancaires');
    content = content.replace(/>Versements \(Mois\)</g, '>Versements bancaires (Mois)<');
    content = content.replace(/name="Versements"/g, 'name="Versements bancaires"');
    content = content.replace(/Versements Réalisés/g, 'Versements bancaires Réalisés');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
