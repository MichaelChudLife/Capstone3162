import "dotenv/config";
import { hashPassword } from "../src/lib/password";
import { DEMO_PASSWORD, seedDemoWorkspace, seedPassword } from "../src/lib/seed";
import { db, disconnectDb } from "../src/lib/db";

process.env.TZ = process.env.APP_TIME_ZONE || "Australia/Melbourne";

async function main(): Promise<void> {
  const client = db();
  if ((await client.member.count()) > 0) {
    console.log("Seed skipped: the database already has members.");
    return;
  }
  const password = seedPassword(process.env);
  await seedDemoWorkspace(client, { passwordHash: hashPassword(password) });
  const source = process.env.SEED_PASSWORD ? "the SEED_PASSWORD value" : `"${DEMO_PASSWORD}"`;
  console.log(`Seeded the demo workspace. The 5 demo members log in with ${source}.`);
}

main()
  .finally(disconnectDb)
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
