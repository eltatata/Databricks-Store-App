import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDashboardFiltersStore } from '@/states/dashboard-filters.store';
import { resolvePeriod } from '@/utils/period';

export const useDashboardPeriod = () => {
  const { presetId, from, to } = useDashboardFiltersStore(
    useShallow((state) => ({ presetId: state.presetId, from: state.customRange.from, to: state.customRange.to }))
  );
  return useMemo(() => resolvePeriod(presetId, { from, to }), [presetId, from, to]);
};
