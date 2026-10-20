import { afterAll, beforeAll, inject, vi } from "vitest";
import { Client } from "pg";

vi.mock("next/headers", () => ({
  cookies: async () => {
    const jar = (globalThis as unknown as { ccaHubCookieJar: Map<string, string> }).ccaHubCookieJar;
    return {
      get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
      set: (name: string, value: string) => {
        jar.set(name, value);
      },
      delete: (name: string) => {
        jar.delete(name);
      },
    };
  },
}));

const adminUrl = new URL(inject("databaseAdminUrl"));
const database = `cca_hub_test_${process.env.VITEST_POOL_ID ?? "1"}`;

beforeAll(async () => {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (!rowCount) await admin.query(`CREATE DATABASE "${database}" TEMPLATE "cca_hub_test_template"`);
  } finally {
    await admin.end();
  }
  const workerUrl = new URL(adminUrl);
  workerUrl.pathname = `/${database}`;
  process.env.DATABASE_URL = workerUrl.toString();
});

afterAll(async () => {
  const { disconnectDb } = await import("@/lib/db");
  await disconnectDb();
});
