import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/http';
import { ProductForm } from '@/components/products/ProductForm';
import {
  EMPTY_PRODUCT_FORM,
  changedFields,
  formValuesToInput,
  type ProductFormValues,
} from '@/components/products/product-form.schema';
import type { Product } from '@/types/product.types';
import { renderWithProviders } from './render';

vi.mock('@/services/products.service', () => ({
  productsService: { listCategories: vi.fn().mockResolvedValue(['housewares', 'health_beauty']) },
}));

const renderForm = (
  onSubmit = vi.fn<(values: ProductFormValues) => Promise<unknown>>().mockResolvedValue(undefined)
) => {
  renderWithProviders(
    <ProductForm
      initialValues={EMPTY_PRODUCT_FORM}
      submitLabel="Create product"
      pendingLabel="Creating…"
      onSubmit={onSubmit}
    />
  );
  return onSubmit;
};

describe('ProductForm', () => {
  it('blocks submission and explains each invalid field', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText('Name'), ' ');
    await user.type(screen.getByLabelText('Category'), 'Bad Category');
    await user.type(screen.getByLabelText('List price'), '-3');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Enter a product name')).toBeInTheDocument();
    expect(screen.getByText('Use lowercase snake_case, for example health_beauty')).toBeInTheDocument();
    expect(screen.getByText('Price cannot be negative')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText('Name'), '  Desk Lamp ');
    await user.type(screen.getByLabelText('Category'), 'housewares');
    await user.type(screen.getByLabelText('List price'), '129.9');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(formValuesToInput(onSubmit.mock.calls[0][0])).toEqual({
      displayName: 'Desk Lamp',
      categoryEn: 'housewares',
      listPriceBrl: 129.9,
      weightG: null,
      lengthCm: null,
      heightCm: null,
      widthCm: null,
    });
  });

  it('shows server field issues next to the field', async () => {
    const user = userEvent.setup();
    renderForm(
      vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Invalid',
          details: [{ path: 'categoryEn', message: 'Category is not allowed' }],
        })
      )
    );

    await user.type(screen.getByLabelText('Name'), 'Desk Lamp');
    await user.type(screen.getByLabelText('Category'), 'housewares');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    expect(await screen.findByText('Category is not allowed')).toBeInTheDocument();
  });
});

describe('changedFields', () => {
  it('sends only the fields that differ from the product', () => {
    const product: Product = {
      productId: 'p1',
      displayName: 'Lamp',
      categoryEn: 'housewares',
      weightG: 500,
      lengthCm: null,
      heightCm: null,
      widthCm: null,
      listPriceBrl: 10,
      isActive: true,
      source: 'app',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      version: 3,
    };

    expect(
      changedFields(product, {
        displayName: 'Lamp',
        categoryEn: 'housewares',
        weightG: 500,
        lengthCm: null,
        heightCm: null,
        widthCm: null,
        listPriceBrl: 12,
      })
    ).toEqual({ listPriceBrl: 12 });
  });
});
