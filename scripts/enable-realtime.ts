import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Activer Supabase Realtime pour la table Notification
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";`);
    console.log("Realtime enabled for Notification table");
  } catch (err: any) {
    if (err.message.includes('already contains')) {
      console.log("Table Notification is already in supabase_realtime publication.");
    } else {
      console.error("Error enabling realtime:", err);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
