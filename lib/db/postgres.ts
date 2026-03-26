import { Pool } from "pg";
import type { QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. See .env.example.");
  }

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

export const pgPool = globalForPg.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pgPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const result = await pgPool.query<T>(text, params);
  return result.rows;
}

