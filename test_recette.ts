import { prisma } from './src/lib/prisma';
async function main() {
  const recettes = await prisma.operation.findMany({ where: { type: 'RECETTE' } });
  console.log('Total Recettes:', recettes.length);
  const validee = recettes.filter(r => r.statut === 'VALIDEE');
  console.log('VALIDEE Recettes:', validee.length);
  const valideeDG = recettes.filter(r => r.statut === 'VALIDEE_DG');
  console.log('VALIDEE_DG Recettes:', valideeDG.length);
}
main().finally(() => prisma.$disconnect());
