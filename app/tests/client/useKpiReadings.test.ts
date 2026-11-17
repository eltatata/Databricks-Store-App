import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pickLargestMove, useKpiReadings } from '@/hooks/dashboard/useKpiReadings';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardSummary } from '@/types/dashboard.types';
import { renderHookWithProviders } from './render';

vi.mock('@/services/dashboard.service', () => ({ dashboardService: { getSummary: vi.fn() } }));

const summary = (overrides: Partial<DashboardSummary>): DashboardSummary => ({
  gmv: 1000,
  orders: 10,
  itemsSold: 12,
  freight: 50,
  customers: 9,
  averageOrderValue: 100,
  averageReviewScore: 4,
  lateDeliveryRate: 0.05,
  firstOrderDate: '2018-01-01',
  lastOrderDate: '2018-08-31',
  ...overrides,
});

const getSummary = vi.mocked(dashboardService.getSummary);

describe('useKpiReadings', () => {
  beforeEach(() => {
    getSummary.mockImplementation((range) =>
      Promise.resolve(
        range.from === '2018-01-01' ? summary({ gmv: 1500, orders: 12, lateDeliveryRate: 0.08 }) : summary({})
      )
    );
  });

  it('pairs each KPI with the comparison period and its change', async () => {
    const { result } = renderHookWithProviders(() =>
      useKpiReadings({ from: '2018-01-01', to: '2018-08-31' }, { from: '2017-01-01', to: '2017-08-31' })
    );

    await waitFor(() => expect(result.current.readings).toHaveLength(6));
    await waitFor(() => expect(result.current.readings[0]?.previous).toBe(1000));

    const gmv = result.current.readings.find((reading) => reading.definition.key === 'gmv');
    const late = result.current.readings.find((reading) => reading.definition.key === 'lateDeliveryRate');
    expect(gmv?.change).toBeCloseTo(0.5);
    expect(late?.change).toBeCloseTo(0.03);
    expect(result.current.largestMove).toBe('lateDeliveryRate');
  });

  it('shows values without change when there is no comparison period', async () => {
    const { result } = renderHookWithProviders(() => useKpiReadings({}, null));

    await waitFor(() => expect(result.current.readings).toHaveLength(6));
    expect(result.current.readings.every((reading) => reading.change === null)).toBe(true);
    expect(result.current.largestMove).toBeNull();
    expect(getSummary).toHaveBeenCalledTimes(1);
  });

  it('surfaces the error when the summary fails', async () => {
    getSummary.mockRejectedValue(new Error('down'));
    const { result } = renderHookWithProviders(() => useKpiReadings({}, null));

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.readings).toEqual([]);
  });
});

describe('pickLargestMove', () => {
  it('ignores readings without a change', () => {
    expect(pickLargestMove([])).toBeNull();
  });
});
