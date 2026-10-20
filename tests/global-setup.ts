import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseAdminUrl: string;
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

async function prepareTemplate(adminUrl: string) {
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const { rows } = await admin.query("SELECT datname FROM pg_database WHERE datname LIKE 'cca_hub_test_%'");
    for (const { datname } of rows) await admin.query(`DROP DATABASE "${datname}" WITH (FORCE)`);
    await admin.query('CREATE DATABASE "cca_hub_test_template"');
  } finally {
    await admin.end();
  }
  const templateUrl = new URL(adminUrl);
  templateUrl.pathname = "/cca_hub_test_template";
  const template = new Client({ connectionString: templateUrl.toString() });
  await template.connect();
  try {
    const migrations = join(process.cwd(), "prisma", "migrations");
    for (const name of readdirSync(migrations).filter((entry) => /^\d+_/.test(entry)).sort()) {
      await template.query(readFileSync(join(migrations, name, "migration.sql"), "utf8"));
    }
  } finally {
    await template.end();
  }
}

export default async function setup(project: TestProject) {
  const external = process.env.TEST_DATABASE_ADMIN_URL;
  if (external) {
    await prepareTemplate(external);
    project.provide("databaseAdminUrl", external);
    return;
  }

  const databaseDir = mkdtempSync(join(tmpdir(), "cca-hub-test-db-"));
  const port = await freePort();
  const postgres = new EmbeddedPostgres({
    databaseDir,
    port,
    user: "postgres",
    password: "postgres",
    persistent: false,
    createPostgresUser: process.getuid?.() === 0,
    onLog: () => {},
  });
  await postgres.initialise();
  await postgres.start();
  const adminUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  await prepareTemplate(adminUrl);
  project.provide("databaseAdminUrl", adminUrl);

  return async () => {
    await postgres.stop();
    rmSync(databaseDir, { recursive: true, force: true });
  };
}
