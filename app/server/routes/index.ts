import { type Application, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { API_PREFIX, DOCS_PATH, OPENAPI_PATH } from '../config/constants';
import { buildOpenApiDocument } from '../docs/openapi';
import type { RouteDefinition } from '../interfaces/route.interface';
import { errorHandler } from '../middlewares/error.middleware';
import { notFoundHandler } from '../middlewares/not-found.middleware';
import { requestContext, type RequestContextOptions } from '../middlewares/request-context.middleware';
import { requestLogger } from '../middlewares/request-logger.middleware';
import { validate } from '../middlewares/validate.middleware';
import { apiRouteDefinitions } from './definitions';

function mountRoute(router: Router, route: RouteDefinition): void {
  const handlers = route.request ? [validate(route.request), route.handler] : [route.handler];
  router[route.method](route.path, ...handlers);
}

export function buildApiRouter(
  options: RequestContextOptions,
  routes: RouteDefinition[] = apiRouteDefinitions
): Router {
  const router = Router();
  const openApiDocument = buildOpenApiDocument(routes);
  router.use(requestContext(options), requestLogger);
  router.get(OPENAPI_PATH, (_request, response) => {
    response.json(openApiDocument);
  });
  router.use(DOCS_PATH, swaggerUi.serve, swaggerUi.setup(openApiDocument));
  routes.forEach((route) => mountRoute(router, route));
  router.use(notFoundHandler);
  return router;
}

export function registerApiRoutes(app: Application, options: RequestContextOptions): void {
  app.use(API_PREFIX, buildApiRouter(options));
  app.use(API_PREFIX, errorHandler);
}
