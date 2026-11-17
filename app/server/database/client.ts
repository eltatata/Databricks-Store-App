import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import { mapDatabaseError } from '../utils/db-errors';
import { internalError } from '../utils/errors';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;

const MAX_POOL_CONNECTIONS = 5;

let database: Database | undefined;
let pool: Pool | undefined;

export function initDatabase(config: PoolConfig): Database {
  pool = new Pool({ ...config, max: MAX_POOL_CONNECTIONS });
  database = drizzle(pool, { schema });
  return database;
}

export function getDb(): Database {
  if (!database) {
    throw internalError(new Error('Database accessed before initDatabase was called'));
  }
  return database;
}

export async function runQuery<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export function withTransaction<T>(work: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
  return runQuery(() => getDb().transaction(work));
}

export async function pingDatabase(): Promise<void> {
  await runQuery(() => getDb().execute(sql`SELECT 1`));
}
