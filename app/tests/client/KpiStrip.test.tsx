import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/http';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { KPI_DEFINITIONS } from '@/configs/dashboard';
import type { KpiReading } from '@/types/dashboard.types';

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

const readings: KpiReading[] = KPI_DEFINITIONS.map((definition, index) => ({
  definition,
  value: 100 + index,
  previous: 90 + index,
  change: definition.key === 'customers' ? 0.4 : 0.05,
}));

const baseProps = {
  readings,
  largestMove: 'customers' as const,
  comparisonLabel: 'vs 2017',
  isPending: false,
  isFetching: false,
  error: null,
  onRetry: vi.fn(),
};

describe('KpiStrip', () => {
  it('renders a skeleton while loading', () => {
    render(<KpiStrip {...baseProps} readings={[]} isPending />);

    expect(screen.getByLabelText('Loading key indicators')).toHaveAttribute('aria-busy', 'true');
  });

  it('offers a retry when the indicators fail to load', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <KpiStrip
        {...baseProps}
        readings={[]}
        error={new ApiError({ status: 503, code: 'DB_UNAVAILABLE', message: 'down', requestId: 'req-9' })}
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Lakebase is not answering');
    expect(screen.getByText('Request req-9')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('labels every KPI and marks only the largest move', () => {
    render(<KpiStrip {...baseProps} />);

    KPI_DEFINITIONS.forEach((definition) => expect(screen.getByText(definition.label)).toBeInTheDocument());
    expect(screen.getAllByText('largest move')).toHaveLength(1);
    expect(screen.getByText('+40%')).toBeInTheDocument();
  });

  it('says when there is no comparison period', () => {
    render(
      <KpiStrip
        {...baseProps}
        largestMove={null}
        readings={readings.map((reading) => ({ ...reading, previous: null, change: null }))}
      />
    );

    expect(screen.getAllByText('No comparison period')).toHaveLength(KPI_DEFINITIONS.length);
  });
});
