import { pingDatabase } from '../database/client';
import { countAppliedMigrations } from '../database/migrate';
import { logger, serializeError } from '../utils/logger';

interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  appliedMigrations: number;
  checkedAt: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const checkedAt = new Date().toISOString();
  try {
    await pingDatabase();
    return { status: 'ok', database: 'up', appliedMigrations: await countAppliedMigrations(), checkedAt };
  } catch (error) {
    logger.warn('Health check failed', serializeError(error));
    return { status: 'degraded', database: 'down', appliedMigrations: 0, checkedAt };
  }
}
