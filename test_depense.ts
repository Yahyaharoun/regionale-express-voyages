import { prisma } from './src/lib/prisma';
async function main() {
  const ops = await prisma.operation.findMany({
    where: { type: 'DEPENSE' },
  });
  console.log('Expenses:', ops.map(o => ({ date: o.createdAt, statut: o.statut, montant: o.montant, bankId: o.bankId })));
}
main().finally(() => prisma.$disconnect());
