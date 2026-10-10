import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActorContext } from '../../server/interfaces/context.interface';
import type { ProductRecord } from '../../server/interfaces/product.interface';

vi.mock('../../server/database/client', () => ({
  withTransaction: vi.fn((work: (transaction: unknown) => Promise<unknown>) => work({ transaction: true })),
}));
vi.mock('../../server/database/queries/products.queries', () => ({
  countProducts: vi.fn(),
  deleteProduct: vi.fn(),
  findProductById: vi.fn(),
  findProducts: vi.fn(),
  insertProduct: vi.fn(),
  listProductCategories: vi.fn(),
  updateProductAtVersion: vi.fn(),
}));
vi.mock('../../server/services/audit.service', () => ({ recordAuditEvent: vi.fn() }));

const queries = await import('../../server/database/queries/products.queries');
const audit = await import('../../server/services/audit.service');
const productsService = await import('../../server/services/products.service');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const actor: ActorContext = { userEmail: 'dev@example.com', channel: 'ui' };

function buildProduct(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    productId: 'p-1',
    displayName: 'Bed Bath Table #1e9e8ef0',
    categoryEn: 'bed_bath_table',
    weightG: 500,
    lengthCm: 20,
    heightCm: 10,
    widthCm: 15,
    listPriceBrl: 89.9,
    isActive: true,
    source: 'olist_seed',
    createdAt: '2026-10-09T00:00:00Z',
    updatedAt: '2026-10-09T00:00:00Z',
    version: 1,
    ...overrides,
  };
}

describe('products service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists products with filters derived from the query', async () => {
    vi.mocked(queries.findProducts).mockResolvedValue([buildProduct()]);
    vi.mocked(queries.countProducts).mockResolvedValue(41);

    const page = await productsService.listProducts({
      page: 3,
      pageSize: 20,
      search: 'bed',
      active: true,
      sortBy: 'displayName',
      sortDirection: 'asc',
    });

    expect(queries.findProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'bed', isActive: true, limit: 20, offset: 40 })
    );
    expect(page.meta).toEqual({ page: 3, pageSize: 20, total: 41, totalPages: 3 });
  });

  it('throws NOT_FOUND for unknown products', async () => {
    vi.mocked(queries.findProductById).mockResolvedValue(undefined);

    await expect(productsService.getProduct('missing')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('creates app products with a generated id and records an audit event', async () => {
    vi.mocked(queries.insertProduct).mockImplementation((values) =>
      Promise.resolve(buildProduct({ ...values, source: 'app' }))
    );

    const product = await productsService.createProduct({ displayName: 'New Lamp', categoryEn: 'housewares' }, actor);

    const [insertedValues, executor] = vi.mocked(queries.insertProduct).mock.calls[0];
    expect(insertedValues).toMatchObject({ displayName: 'New Lamp', source: 'app' });
    expect(insertedValues.productId).toMatch(UUID_PATTERN);
    expect(executor).toEqual({ transaction: true });
    expect(product.source).toBe('app');
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', actor }), {
      transaction: true,
    });
  });

  it('updates with the expected version', async () => {
    vi.mocked(queries.findProductById).mockResolvedValue(buildProduct());
    vi.mocked(queries.updateProductAtVersion).mockResolvedValue(buildProduct({ displayName: 'Renamed', version: 2 }));

    const updated = await productsService.updateProduct('p-1', { displayName: 'Renamed', version: 1 }, actor);

    expect(queries.updateProductAtVersion).toHaveBeenCalledWith(
      'p-1',
      1,
      { displayName: 'Renamed' },
      { transaction: true }
    );
    expect(updated.version).toBe(2);
  });

  it('raises VERSION_CONFLICT when the version is stale', async () => {
    vi.mocked(queries.findProductById).mockResolvedValue(buildProduct({ version: 3 }));
    vi.mocked(queries.updateProductAtVersion).mockResolvedValue(undefined);

    await expect(
      productsService.updateProduct('p-1', { displayName: 'Renamed', version: 1 }, actor)
    ).rejects.toMatchObject({
      status: 409,
      code: 'VERSION_CONFLICT',
    });
    expect(audit.recordAuditEvent).not.toHaveBeenCalled();
  });

  it('treats deactivating an inactive product as a no-op', async () => {
    const inactive = buildProduct({ isActive: false });
    vi.mocked(queries.findProductById).mockResolvedValue(inactive);

    await expect(productsService.deactivateProduct('p-1', actor)).resolves.toBe(inactive);
    expect(queries.updateProductAtVersion).not.toHaveBeenCalled();
  });

  it('deactivates active products and records the change', async () => {
    vi.mocked(queries.findProductById).mockResolvedValue(buildProduct());
    vi.mocked(queries.updateProductAtVersion).mockResolvedValue(buildProduct({ isActive: false, version: 2 }));

    const product = await productsService.deactivateProduct('p-1', actor);

    expect(queries.updateProductAtVersion).toHaveBeenCalledWith('p-1', 1, { isActive: false }, { transaction: true });
    expect(product.isActive).toBe(false);
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'deactivate' }), {
      transaction: true,
    });
  });

  it('refuses to hard delete catalog products', async () => {
    vi.mocked(queries.findProductById).mockResolvedValue(buildProduct({ source: 'olist_seed' }));

    await expect(productsService.deleteProductPermanently('p-1', actor)).rejects.toMatchObject({ status: 422 });
    expect(queries.deleteProduct).not.toHaveBeenCalled();
  });

  it('hard deletes products created in the app', async () => {
    vi.mocked(queries.findProductById).mockResolvedValue(buildProduct({ source: 'app' }));

    await productsService.deleteProductPermanently('p-1', actor);

    expect(queries.deleteProduct).toHaveBeenCalledWith('p-1', { transaction: true });
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }), {
      transaction: true,
    });
  });
});
