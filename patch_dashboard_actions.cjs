const fs = require('fs');
let content = fs.readFileSync('src/actions/dashboardActions.ts', 'utf8');

// 1. Add Recettes to PDGStats interface
content = content.replace(
  'objectiveProgress: number;',
  'objectiveProgress: number;\n  recetteDay: number;\n  recetteMonth: number;\n  totalRecettes: number;'
);

// 2. Initialize Recettes variables
content = content.replace(
  'let revenueDay = 0, revenueMonth = 0;',
  'let revenueDay = 0, revenueMonth = 0;\n  let recetteDay = 0, recetteMonth = 0;\n  let totalRecettes = 0;'
);

// 3. Process RECETTE inside the loop
const processRecette = `
    } else if (op.type === 'RECETTE') {
      if (op.createdAt >= startOfDay) recetteDay += op.montant;
      recetteMonth += op.montant;
      totalRecettes += op.montant;
    }`;
content = content.replace(
  'totalDeposits += op.montant;\n    }',
  'totalDeposits += op.montant;\n    }' + processRecette
);

// 4. Return new stats in PDGDashboardStats
content = content.replace(
  'objectiveProgress: Math.min(objectiveProgress, 100)\n  };',
  'objectiveProgress: Math.min(objectiveProgress, 100),\n    recetteDay,\n    recetteMonth,\n    totalRecettes\n  };'
);

// 5. Update getChartData grouping
const recetteMapDef = `
  const recettesByCategoryMap = new Map<string, number>();
  const recettesByAgencyMap = new Map<string, number>();
`;
content = content.replace(
  'const expensesByCategoryMap = new Map<string, number>();',
  'const expensesByCategoryMap = new Map<string, number>();' + recetteMapDef
);

const processRecetteChart = `
  // Recettes par agence
  operations.filter(op => op.type === 'RECETTE' && op.agency).forEach(op => {
    const agName = op.agency?.nom || 'Inconnue';
    recettesByAgencyMap.set(agName, (recettesByAgencyMap.get(agName) || 0) + op.montant);
  });
`;
content = content.replace(
  '// 3. Répartition des versements par banque',
  processRecetteChart + '\n  // 3. Répartition des versements par banque'
);

const formatRecetteChart = `
  const recettesByAgency = Array.from(recettesByAgencyMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
`;
content = content.replace(
  'const depositsByBank = Array.from(depositsByBankMap.entries())',
  formatRecetteChart + '\n  const depositsByBank = Array.from(depositsByBankMap.entries())'
);

// In the daily trend formatting (getChartData loop)
content = content.replace(
  'let dep = 0, rev = 0;',
  'let dep = 0, rev = 0, rec = 0;'
);

content = content.replace(
  'if (op.type === \'DEPENSE\') dep += op.montant;',
  'if (op.type === \'DEPENSE\') dep += op.montant;\n      else if (op.type === \'RECETTE\') rec += op.montant;'
);

content = content.replace(
  'revenues: rev',
  'revenues: rev,\n      recettes: rec'
);

content = content.replace(
  'depositsByBank\n  };',
  'depositsByBank,\n    recettesByAgency\n  };'
);

fs.writeFileSync('src/actions/dashboardActions.ts', content);
