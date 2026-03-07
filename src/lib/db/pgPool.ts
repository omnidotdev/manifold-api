import { Pool } from "pg";

import { DATABASE_URL } from "lib/config/env.config";

/**
 * Postgres database pool.
 * @see https://node-postgres.com/apis/pool
 */
const pgPool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 30_000,
});

export default pgPool;
