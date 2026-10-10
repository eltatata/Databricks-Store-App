import { type DatabaseExecutor, getDb, runQuery } from '../client';
import { auditLog } from '../schema';

export type NewAuditEntry = typeof auditLog.$inferInsert;

export async function insertAuditEntry(entry: NewAuditEntry, executor: DatabaseExecutor = getDb()): Promise<void> {
  await runQuery(() => executor.insert(auditLog).values(entry));
}
