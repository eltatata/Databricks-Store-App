import type { RouteDefinition } from '../interfaces/route.interface';
import { adminRoutes } from './admin.routes';
import { dashboardRoutes } from './dashboard.routes';
import { healthRoutes } from './health.routes';
import { productRoutes } from './products.routes';

export const apiRouteDefinitions: RouteDefinition[] = [
  ...healthRoutes,
  ...dashboardRoutes,
  ...productRoutes,
  ...adminRoutes,
];
