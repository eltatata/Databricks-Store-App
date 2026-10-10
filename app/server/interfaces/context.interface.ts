import type { AUDIT_CHANNELS } from '../config/constants';

export type AuditChannel = (typeof AUDIT_CHANNELS)[number];

export interface RequestContext {
  requestId: string;
  userEmail: string;
}

export interface ActorContext {
  userEmail: string;
  channel: AuditChannel;
}
