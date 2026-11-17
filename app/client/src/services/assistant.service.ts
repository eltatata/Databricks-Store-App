import { AGENTS_API_BASE, http } from '@/api/http';
import type { ApprovalRequest } from '@/types/assistant.types';

export const assistantService = {
  decide: async (request: ApprovalRequest) => {
    await http.post<unknown>('/approve', request, { base: AGENTS_API_BASE });
  },
};
