// scripts/grant-permissions.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stock_alert_bot;
  `);

  await prisma.$executeRawUnsafe(`
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO stock_alert_bot;
  `);

  console.log("Permissions granted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
