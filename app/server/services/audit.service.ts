import type { DatabaseExecutor } from '../database/client';
import { insertAuditEntry } from '../database/queries/audit.queries';
import type { ActorContext } from '../interfaces/context.interface';

export interface AuditEvent {
  actor: ActorContext;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

export function recordAuditEvent(event: AuditEvent, executor: DatabaseExecutor): Promise<void> {
  return insertAuditEntry(
    {
      actorEmail: event.actor.userEmail,
      channel: event.actor.channel,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId,
      before: event.before ?? null,
      after: event.after ?? null,
    },
    executor
  );
}
