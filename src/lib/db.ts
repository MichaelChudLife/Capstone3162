import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const holder = globalThis as unknown as { ccaHubDb?: PrismaClient; ccaHubPool?: Pool };

function connect(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and start a database with `npm run db:local`, or point it at your Postgres server.",
    );
  }
  const pool = new Pool({ connectionString, max: Number(process.env.DATABASE_POOL_SIZE ?? 5) });
  attachDatabasePool(pool);
  holder.ccaHubPool = pool;
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export function db(): PrismaClient {
  return (holder.ccaHubDb ??= connect());
}

export async function disconnectDb(): Promise<void> {
  const client = holder.ccaHubDb;
  const pool = holder.ccaHubPool;
  holder.ccaHubDb = undefined;
  holder.ccaHubPool = undefined;
  await client?.$disconnect();
  if (pool && !pool.ended) await pool.end();
}
