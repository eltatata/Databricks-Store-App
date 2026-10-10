import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DASHBOARD_STALE_TIME_MS, KPI_DEFINITIONS } from '@/configs/dashboard';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardSummary, DateRange, KpiDefinition, KpiReading } from '@/types/dashboard.types';
import { dashboardKeys } from './dashboard.keys';

const relativeChange = (definition: KpiDefinition, value: number | null, previous: number | null) => {
  if (value === null || previous === null) {
    return null;
  }
  if (definition.format === 'percent' || definition.format === 'score') {
    return value - previous;
  }
  return previous === 0 ? null : (value - previous) / previous;
};

const toReadings = (current: DashboardSummary, previous: DashboardSummary | undefined): KpiReading[] =>
  KPI_DEFINITIONS.map((definition) => {
    const value = current[definition.key];
    const previousValue = previous && previous.orders > 0 ? previous[definition.key] : null;
    return { definition, value, previous: previousValue, change: relativeChange(definition, value, previousValue) };
  });

const normalizedMagnitude = (reading: KpiReading) => {
  if (reading.change === null) {
    return 0;
  }
  if (reading.definition.format === 'score') {
    return Math.abs(reading.change) / 5;
  }
  if (reading.definition.format === 'percent' && reading.previous) {
    return Math.abs(reading.change / reading.previous);
  }
  return Math.abs(reading.change);
};

export const pickLargestMove = (readings: KpiReading[]) =>
  readings.reduce<KpiReading | null>((largest, reading) => {
    if (reading.change === null) {
      return largest;
    }
    return !largest || normalizedMagnitude(reading) > normalizedMagnitude(largest) ? reading : largest;
  }, null)?.definition.key ?? null;

export const useKpiReadings = (range: DateRange, comparison: DateRange | null) => {
  const current = useQuery({
    queryKey: dashboardKeys.summary(range),
    queryFn: ({ signal }) => dashboardService.getSummary(range, signal),
    staleTime: DASHBOARD_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  });

  const previous = useQuery({
    queryKey: dashboardKeys.summary(comparison ?? {}),
    queryFn: ({ signal }) => dashboardService.getSummary(comparison ?? {}, signal),
    staleTime: DASHBOARD_STALE_TIME_MS,
    enabled: comparison !== null,
  });

  const readings = useMemo(
    () => (current.data ? toReadings(current.data, comparison ? previous.data : undefined) : []),
    [current.data, previous.data, comparison]
  );

  return {
    readings,
    largestMove: useMemo(() => pickLargestMove(readings), [readings]),
    isPending: current.isPending,
    isFetching: current.isFetching,
    error: current.error,
    refetch: current.refetch,
  };
};
