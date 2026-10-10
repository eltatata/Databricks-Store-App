import { readRequestContext } from '../middlewares/request-context.middleware';
import { seedProductsFromCatalog } from '../services/seed.service';
import { asyncHandler } from '../utils/async-handler';
import { sendOk } from '../utils/response';

export const seedProducts = asyncHandler(async (_request, response) => {
  const actor = { userEmail: readRequestContext(response).userEmail, channel: 'ui' as const };
  sendOk(response, await seedProductsFromCatalog(actor));
});
