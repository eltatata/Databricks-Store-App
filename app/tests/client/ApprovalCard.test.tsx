import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApprovalCard } from '@/components/assistant/ApprovalCard';
import { productsService } from '@/services/products.service';
import type { AssistantToolItem } from '@/types/assistant.types';
import { renderWithProviders } from './render';

vi.mock('@/services/products.service', () => ({ productsService: { get: vi.fn() } }));

const createTool: AssistantToolItem = {
  kind: 'tool',
  id: 'c1',
  name: 'create_product',
  args: { displayName: 'Linen Throw', categoryEn: 'bed_bath_table', listPriceBrl: 189.9 },
  output: null,
  approval: { approvalId: 'a1', streamId: 's1', effect: 'write' },
};

describe('ApprovalCard', () => {
  it('shows what will be created and sends the decision', async () => {
    const onDecide = vi.fn();
    renderWithProviders(<ApprovalCard tool={createTool} state="pending" onDecide={onDecide} />);

    expect(screen.getByRole('heading', { name: 'Create product' })).toBeInTheDocument();
    expect(screen.getByText('Linen Throw')).toBeInTheDocument();
    expect(screen.getByText('bed bath table')).toBeInTheDocument();
    expect(screen.getByText('R$189.90')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await userEvent.click(screen.getByRole('button', { name: 'Deny' }));
    expect(onDecide.mock.calls).toEqual([['approve'], ['deny']]);
  });

  it('hides the actions once the decision is final', () => {
    renderWithProviders(<ApprovalCard tool={createTool} state="denied" onDecide={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Denied. Nothing was changed.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('compares current and new values for an update', async () => {
    vi.mocked(productsService.get).mockResolvedValue({
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
      version: 2,
    });
    const updateTool: AssistantToolItem = {
      ...createTool,
      name: 'update_product',
      args: { productId: 'p1', version: 2, changes: { listPriceBrl: 99.9 } },
      approval: { approvalId: 'a2', streamId: 's1', effect: 'update' },
    };
    renderWithProviders(<ApprovalCard tool={updateTool} state="pending" onDecide={vi.fn()} />);

    expect(await screen.findByText('Desk Lamp')).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /Price/ });
    expect(row).toHaveTextContent('R$129.90');
    expect(row).toHaveTextContent('R$99.90');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('uses a destructive button to deactivate', () => {
    const deactivateTool: AssistantToolItem = {
      ...createTool,
      name: 'deactivate_product',
      args: { productId: 'p1' },
      approval: { approvalId: 'a3', streamId: 's1', effect: 'destructive' },
    };
    renderWithProviders(<ApprovalCard tool={deactivateTool} state="submitting" onDecide={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Deactivate' })).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
  });
});
