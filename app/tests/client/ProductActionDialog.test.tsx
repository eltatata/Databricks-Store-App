import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductActionDialog } from '@/components/products/ProductActionDialog';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types/product.types';
import { renderWithProviders } from './render';

vi.mock('@/services/products.service', () => ({
  productsService: { deactivate: vi.fn(), removePermanently: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const product: Product = {
  productId: 'p1',
  displayName: 'Desk Lamp',
  categoryEn: 'housewares',
  weightG: null,
  lengthCm: null,
  heightCm: null,
  widthCm: null,
  listPriceBrl: 129.9,
  isActive: true,
  source: 'app',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  version: 1,
};

describe('ProductActionDialog', () => {
  it('asks before deactivating and calls the service only after confirmation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(productsService.deactivate).mockResolvedValue({ ...product, isActive: false, version: 2 });
    renderWithProviders(<ProductActionDialog action={{ kind: 'deactivate', product }} onClose={onClose} />);

    expect(screen.getByText('Deactivate this product?')).toBeInTheDocument();
    expect(productsService.deactivate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(productsService.deactivate).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does nothing when the operator keeps the product', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<ProductActionDialog action={{ kind: 'delete', product }} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Keep product' }));

    expect(productsService.removePermanently).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open when the deletion fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(productsService.removePermanently).mockRejectedValue(new Error('boom'));
    renderWithProviders(<ProductActionDialog action={{ kind: 'delete', product }} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    await waitFor(() => expect(productsService.removePermanently).toHaveBeenCalledWith('p1'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
