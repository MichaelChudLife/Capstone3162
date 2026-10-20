import { existsSync } from "node:fs";
import { resolve } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const port = Number(process.env.LOCAL_DB_PORT ?? 54329);
const databaseDir = resolve(".local-db");

const postgres = new EmbeddedPostgres({
  databaseDir,
  port,
  user: "postgres",
  password: "postgres",
  persistent: true,
  createPostgresUser: process.getuid?.() === 0,
  onLog: () => {},
});

if (!existsSync(resolve(databaseDir, "PG_VERSION"))) {
  console.log("Creating a local Postgres in .local-db (first run only)…");
  await postgres.initialise();
}
await postgres.start();
await postgres.createDatabase("cca_hub").catch(() => {});

console.log(`Postgres is running on port ${port}.`);
console.log(`DATABASE_URL="postgresql://postgres:postgres@localhost:${port}/cca_hub"`);
console.log("Leave this running. Press Ctrl+C to stop it.");

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await postgres.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
