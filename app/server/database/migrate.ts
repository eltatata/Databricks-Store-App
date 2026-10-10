import path from 'node:path';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { MIGRATIONS_FOLDER } from '../config/constants';
import { logger } from '../utils/logger';
import { getDb, runQuery } from './client';

const MIGRATIONS_SCHEMA = 'drizzle';
const MIGRATIONS_TABLE = '__drizzle_migrations';

export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), MIGRATIONS_FOLDER);
  logger.info('Applying database migrations', { migrationsFolder });
  await runQuery(() =>
    migrate(getDb(), { migrationsFolder, migrationsSchema: MIGRATIONS_SCHEMA, migrationsTable: MIGRATIONS_TABLE })
  );
  logger.info('Database migrations applied', { appliedMigrations: await countAppliedMigrations() });
}

export async function countAppliedMigrations(): Promise<number> {
  const result = await runQuery(() =>
    getDb().execute<{ total: number }>(
      sql`SELECT count(*)::int AS total FROM ${sql.identifier(MIGRATIONS_SCHEMA)}.${sql.identifier(MIGRATIONS_TABLE)}`
    )
  );
  return result.rows[0]?.total ?? 0;
}
