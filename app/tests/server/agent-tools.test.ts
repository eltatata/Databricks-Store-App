import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductRecord } from '../../server/interfaces/product.interface';

vi.mock('@databricks/appkit', () => ({ getCallerContext: vi.fn() }));
vi.mock('../../server/services/products.service', () => ({
  listProducts: vi.fn(),
  getProduct: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deactivateProduct: vi.fn(),
}));
vi.mock('../../server/services/dashboard.service', () => ({ getSummary: vi.fn() }));

const appkit = await import('@databricks/appkit');
const productsService = await import('../../server/services/products.service');
const dashboardService = await import('../../server/services/dashboard.service');
const { executeFromRegistry } = await import('@databricks/appkit/beta');
const { buildStoreTools } = await import('../../server/plugins/store-tools/tools');
const { versionConflict } = await import('../../server/utils/errors');

const product: ProductRecord = {
  productId: 'p-1',
  displayName: 'Desk Lamp',
  categoryEn: 'housewares',
  weightG: 500,
  lengthCm: 20,
  heightCm: 10,
  widthCm: 15,
  listPriceBrl: 89.9,
  isActive: true,
  source: 'app',
  createdAt: '2026-10-09T00:00:00Z',
  updatedAt: '2026-10-09T00:00:00Z',
  version: 3,
};

const tools = buildStoreTools({ devUserEmail: 'dev@example.com' });
const run = (name: string, args: unknown) => executeFromRegistry(tools, name, args);

describe('store agent tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appkit.getCallerContext).mockReturnValue(undefined);
  });

  it('requires approval for every mutating tool and none of the reads', () => {
    const effects = Object.fromEntries(Object.entries(tools).map(([name, entry]) => [name, entry.annotations?.effect]));
    expect(effects).toEqual({
      get_kpi_summary: 'read',
      search_products: 'read',
      get_product: 'read',
      create_product: 'write',
      update_product: 'update',
      deactivate_product: 'destructive',
    });
  });

  it('reads KPIs for the requested range', async () => {
    vi.mocked(dashboardService.getSummary).mockResolvedValue({ gmv: 10 } as never);
    await expect(run('get_kpi_summary', { from: '2018-01-01', to: '2018-06-30' })).resolves.toEqual({ gmv: 10 });
    expect(dashboardService.getSummary).toHaveBeenCalledWith({ from: '2018-01-01', to: '2018-06-30' });
  });

  it('rejects an invalid date range with a structured validation error', async () => {
    const result = await run('get_kpi_summary', { from: '2018-07-01', to: '2018-01-01' });
    expect(result).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    expect(dashboardService.getSummary).not.toHaveBeenCalled();
  });

  it('searches only active products by default and caps the page size', async () => {
    vi.mocked(productsService.listProducts).mockResolvedValue({
      items: [product],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    const result = await run('search_products', { query: 'lamp' });
    expect(productsService.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'lamp', active: true, page: 1, pageSize: 10 })
    );
    expect(result).toMatchObject({ total: 1, products: [{ productId: 'p-1', version: 3 }] });
  });

  it('returns an LLM readable error for malformed arguments without calling the service', async () => {
    const result = await run('search_products', { limit: 500 });
    expect(typeof result).toBe('string');
    expect(productsService.listProducts).not.toHaveBeenCalled();
  });

  it('creates products as the requesting user on the agent channel', async () => {
    vi.mocked(appkit.getCallerContext).mockReturnValue({
      principal: { type: 'user', userId: 'u-1', userEmail: 'operator@example.com' },
    } as never);
    vi.mocked(productsService.createProduct).mockResolvedValue(product);
    await run('create_product', { displayName: 'Desk Lamp', categoryEn: 'housewares', listPriceBrl: 89.9 });
    expect(productsService.createProduct).toHaveBeenCalledWith(
      { displayName: 'Desk Lamp', categoryEn: 'housewares', listPriceBrl: 89.9 },
      { userEmail: 'operator@example.com', channel: 'agent' }
    );
  });

  it('falls back to the development email when there is no caller', async () => {
    vi.mocked(productsService.deactivateProduct).mockResolvedValue({ ...product, isActive: false });
    await run('deactivate_product', { productId: 'p-1' });
    expect(productsService.deactivateProduct).toHaveBeenCalledWith('p-1', {
      userEmail: 'dev@example.com',
      channel: 'agent',
    });
  });

  it('rejects a category that is not snake_case before writing', async () => {
    const result = await run('create_product', { displayName: 'Desk Lamp', categoryEn: 'Home Decor' });
    expect(result).toMatchObject({ error: { code: 'VALIDATION_ERROR', details: [{ field: 'categoryEn' }] } });
    expect(productsService.createProduct).not.toHaveBeenCalled();
  });

  it('passes the version to updates and maps a version conflict to a structured error', async () => {
    vi.mocked(productsService.updateProduct).mockRejectedValue(versionConflict('Product', 'p-1'));
    const result = await run('update_product', { productId: 'p-1', version: 3, changes: { listPriceBrl: 79.9 } });
    expect(productsService.updateProduct).toHaveBeenCalledWith(
      'p-1',
      { listPriceBrl: 79.9, version: 3 },
      expect.objectContaining({ channel: 'agent' })
    );
    expect(result).toMatchObject({ error: { code: 'VERSION_CONFLICT' } });
  });

  it('hides unexpected errors behind a generic message', async () => {
    vi.mocked(productsService.getProduct).mockRejectedValue(new Error('connection reset'));
    await expect(run('get_product', { productId: 'p-1' })).resolves.toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'The operation failed. Try again later' },
    });
  });
});
