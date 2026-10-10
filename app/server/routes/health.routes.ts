import { getHealth } from '../controllers/health.controller';
import type { RouteDefinition } from '../interfaces/route.interface';
import { healthResponseSchema } from '../schemas/common.schema';

export const healthRoutes: RouteDefinition[] = [
  {
    method: 'get',
    path: '/health',
    summary: 'Check the API and Lakebase connectivity',
    tag: 'Health',
    responses: {
      200: { description: 'Healthy', schema: healthResponseSchema },
      503: { description: 'Database unreachable', schema: healthResponseSchema },
    },
    handler: getHealth,
  },
];
