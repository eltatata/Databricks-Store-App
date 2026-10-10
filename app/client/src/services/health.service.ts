import { http } from '@/api/http';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  appliedMigrations: number;
  checkedAt: string;
}

export const healthService = {
  get: async (signal?: AbortSignal) => (await http.get<HealthStatus>('/health', { signal })).data,
};
