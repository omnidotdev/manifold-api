import { readMigrationFiles } from "drizzle-orm/migrator";

import type { Pool } from "pg";

const MIGRATIONS_FOLDER = "src/generated/drizzle";

/**
 * One-time reconciliation for the 13 -> 1 migration squash.
 *
 * A database that was migrated BEFORE the squash has the pre-squash migration
 * hashes recorded in `drizzle.__drizzle_migrations`, but not the new baseline's.
 * drizzle's `migrate()` goes by hash, so it would treat the baseline as pending
 * and run `CREATE TABLE` over the already-existing tables, crashing on boot.
 *
 * This stamps the baseline as already-applied on such a database (using
 * drizzle's OWN hash from `readMigrationFiles`, so it matches exactly what
 * `migrate()` looks for) and drops the orphaned pre-squash rows, so the
 * subsequent `migrate()` is a no-op. A FRESH database (no migrations table, or
 * an empty one) is left untouched, so `migrate()` runs the baseline normally.
 * Once a database carries the baseline hash this is a no-op forever.
 *
 * Idempotent and safe to run before every `migrate()`.
 */
export const reconcileSquashedBaseline = async (
  pool: Pool,
  migrationsFolder: string = MIGRATIONS_FOLDER,
): Promise<void> => {
  const [baseline] = readMigrationFiles({ migrationsFolder });
  if (!baseline) return;

  // Fresh database: the migrations table does not exist yet -> let migrate()
  // create it and run the baseline
  const { rows: tableRows } = await pool.query<{ present: boolean }>(
    "select to_regclass('drizzle.__drizzle_migrations') is not null as present",
  );
  if (!tableRows[0]?.present) return;

  const { rows } = await pool.query<{ n: number; has_baseline: boolean }>(
    "select count(*)::int as n, coalesce(bool_or(hash = $1), false) as has_baseline from drizzle.__drizzle_migrations",
    [baseline.hash],
  );
  const recorded = rows[0]?.n ?? 0;
  const hasBaseline = rows[0]?.has_baseline ?? false;

  // Empty table -> fresh; already carries the baseline -> done. Either way,
  // nothing to reconcile
  if (recorded === 0 || hasBaseline) return;

  // Pre-squash database: replace the orphaned old rows with the baseline so
  // migrate() sees it as applied and does not recreate existing tables
  await pool.query("delete from drizzle.__drizzle_migrations");
  await pool.query(
    "insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)",
    [baseline.hash, baseline.folderMillis],
  );
};
