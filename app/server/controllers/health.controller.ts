import { checkHealth } from '../services/health.service';
import { asyncHandler } from '../utils/async-handler';

export const getHealth = asyncHandler(async (_request, response) => {
  const health = await checkHealth();
  response.status(health.status === 'ok' ? 200 : 503).json({ data: health });
});
