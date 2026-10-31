import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { Pool } from "pg";

import { reconcileSquashedBaseline } from "lib/db/reconcileBaseline";

const MIGRATIONS = "./src/generated/drizzle";

// A throwaway database so this test never touches the shared suite database
const DB_NAME = `reconcile_${randomUUID().replace(/-/g, "")}`;

let adminPool: Pool;
let dbUrl: string;

const run = async (sql: string, params: unknown[] = []) => {
  const pool = new Pool({ connectionString: dbUrl });
  try {
    return await pool.query(sql, params);
  } finally {
    await pool.end();
  }
};

beforeAll(async () => {
  const base = new URL(globalThis.__TEST_CONTAINER_CONNECTION_STRING__);
  adminPool = new Pool({ connectionString: base.toString() });
  await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
  const target = new URL(base.toString());
  target.pathname = `/${DB_NAME}`;
  dbUrl = target.toString();
});

afterAll(async () => {
  await adminPool.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [DB_NAME],
  );
  await adminPool.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
  await adminPool.end();
});

describe("squashed-baseline migration reconciliation", () => {
  test("a FRESH database runs the baseline and records drizzle's hash", async () => {
    const pool = new Pool({ connectionString: dbUrl });
    try {
      await reconcileSquashedBaseline(pool, MIGRATIONS); // no-op: no table yet
      await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS });
    } finally {
      await pool.end();
    }

    // tables exist
    const t = await run("SELECT to_regclass('public.namespace') AS present");
    expect(t.rows[0].present).toBe("namespace");

    // the recorded hash matches the file hash drizzle reads (by construction)
    const [baseline] = readMigrationFiles({ migrationsFolder: MIGRATIONS });
    const m = await run("SELECT hash FROM drizzle.__drizzle_migrations");
    expect(m.rows.map((r) => r.hash)).toEqual([baseline.hash]);
  });

  test("a PRE-SQUASH database is reconciled, not recreated", async () => {
    // simulate the pre-squash state: tables already exist (from the fresh test
    // above), but __drizzle_migrations holds an old hash, not the baseline's
    await run("DELETE FROM drizzle.__drizzle_migrations");
    await run(
      "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
      ["0000_pre_squash_dummy_hash", Date.now()],
    );

    const pool = new Pool({ connectionString: dbUrl });
    let migrateError: unknown = null;
    try {
      await reconcileSquashedBaseline(pool, MIGRATIONS);
      // must NOT try to CREATE TABLE over the existing schema
      await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS });
    } catch (err) {
      migrateError = err;
    } finally {
      await pool.end();
    }

    expect(migrateError).toBeNull();

    // the baseline is now the only recorded migration, and tables are intact
    const [baseline] = readMigrationFiles({ migrationsFolder: MIGRATIONS });
    const m = await run("SELECT hash FROM drizzle.__drizzle_migrations");
    expect(m.rows.map((r) => r.hash)).toEqual([baseline.hash]);
    const t = await run("SELECT to_regclass('public.namespace') AS present");
    expect(t.rows[0].present).toBe("namespace");
  });
});
