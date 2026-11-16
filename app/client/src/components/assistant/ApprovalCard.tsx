import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/products/useProductQueries';
import { cn } from '@/lib/utils';
import type { ApprovalDecision, ApprovalState, AssistantToolItem } from '@/types/assistant.types';
import type { Product } from '@/types/product.types';
import { formatCount, formatCurrency, humanizeSlug, toDisplayText } from '@/utils/format';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const FIELD_LABELS: Record<string, string> = {
  displayName: 'Name',
  categoryEn: 'Category',
  listPriceBrl: 'Price',
  weightG: 'Weight',
  lengthCm: 'Length',
  heightCm: 'Height',
  widthCm: 'Width',
  isActive: 'Status',
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

const ACTION_COPY: Record<string, { title: string; approveLabel: string }> = {
  create_product: { title: 'Create product', approveLabel: 'Create' },
  update_product: { title: 'Update product', approveLabel: 'Save changes' },
  deactivate_product: { title: 'Deactivate product', approveLabel: 'Deactivate' },
};

const STATE_COPY: Record<ApprovalState, string> = {
  pending: 'Waiting for your decision. Nothing changes until you approve.',
  submitting: 'Sending your decision',
  approved: 'Approved',
  denied: 'Denied. Nothing was changed.',
  expired: 'Expired without a decision. Nothing was changed.',
};

const formatField = (field: string, value: unknown) => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (field === 'listPriceBrl' && typeof value === 'number') {
    return formatCurrency(value);
  }
  if (field === 'weightG' && typeof value === 'number') {
    return `${formatCount(value)} g`;
  }
  if (field.endsWith('Cm') && typeof value === 'number') {
    return `${formatCount(value)} cm`;
  }
  if (field === 'categoryEn' && typeof value === 'string') {
    return humanizeSlug(value);
  }
  if (field === 'isActive' && typeof value === 'boolean') {
    return value ? 'Active' : 'Inactive';
  }
  return toDisplayText(value);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const orderedFields = (values: Record<string, unknown>) => FIELD_ORDER.filter((field) => field in values);

function FieldList({ values }: { values: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-6 gap-y-2 text-sm">
      {orderedFields(values).map((field) => (
        <div key={field} className="contents">
          <dt className="text-ink-3">{FIELD_LABELS[field]}</dt>
          <dd className="text-ink tabular-nums">{formatField(field, values[field])}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChangeTable({ changes, current }: { changes: Record<string, unknown>; current: Product | undefined }) {
  const currentValues = asRecord(current);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-ink-3">
          <th scope="col" className="pb-2 font-normal">
            Field
          </th>
          <th scope="col" className="pb-2 font-normal">
            Now
          </th>
          <th scope="col" className="pb-2 font-normal">
            After approval
          </th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {orderedFields(changes).map((field) => (
          <tr key={field} className="border-t border-hairline">
            <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-3">
              {FIELD_LABELS[field]}
            </th>
            <td className="py-2 pr-4 text-ink-2">{current ? formatField(field, currentValues[field]) : '…'}</td>
            <td className="py-2 text-ink">{formatField(field, changes[field])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TargetProduct({ productId, product }: { productId: string; product: Product | undefined }) {
  return (
    <p className="text-sm text-ink-2">
      <span className="text-ink">{product?.displayName ?? 'Loading the product…'}</span>
      <span className="ml-2 text-xs text-ink-3">{productId}</span>
    </p>
  );
}

interface ApprovalCardProps {
  tool: AssistantToolItem;
  state: ApprovalState;
  onDecide: (decision: ApprovalDecision) => void;
}

export function ApprovalCard({ tool, state, onDecide }: ApprovalCardProps) {
  const productId = typeof tool.args.productId === 'string' ? tool.args.productId : undefined;
  const { data: product } = useProduct(productId);
  const copy = ACTION_COPY[tool.name] ?? { title: tool.name, approveLabel: 'Approve' };
  const isDestructive = tool.approval?.effect === 'destructive';
  const isOpen = state === 'pending' || state === 'submitting';
  const titleId = `approval-${tool.id}`;

  return (
    <motion.section
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-raised p-4 transition-colors duration-300',
        isOpen ? 'border-hairline-strong' : 'border-hairline'
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="text-[13px] font-semibold text-ink">
            {copy.title}
          </h3>
          <p role="status" className="text-xs text-ink-3">
            {STATE_COPY[state]}
          </p>
        </div>
        <AnimatePresence>
          {isOpen ? (
            <motion.span
              aria-hidden
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 38, mass: 0.6 }}
              className="mt-1 size-2 shrink-0 rounded-full bg-brand"
            />
          ) : null}
        </AnimatePresence>
      </header>

      {tool.name === 'create_product' ? <FieldList values={tool.args} /> : null}

      {tool.name === 'update_product' && productId ? (
        <div className="flex flex-col gap-3">
          <TargetProduct productId={productId} product={product} />
          <ChangeTable changes={asRecord(tool.args.changes)} current={product} />
        </div>
      ) : null}

      {tool.name === 'deactivate_product' && productId ? (
        <div className="flex flex-col gap-1">
          <TargetProduct productId={productId} product={product} />
          <p className="text-xs text-ink-3">It stays in the catalog as inactive and can be reactivated later.</p>
        </div>
      ) : null}

      {isOpen ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={state === 'submitting'}
            onClick={() => onDecide('approve')}
            className="active:scale-[0.98]"
          >
            {copy.approveLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={state === 'submitting'}
            onClick={() => onDecide('deny')}
            className="active:scale-[0.98]"
          >
            Deny
          </Button>
        </div>
      ) : null}
    </motion.section>
  );
}
