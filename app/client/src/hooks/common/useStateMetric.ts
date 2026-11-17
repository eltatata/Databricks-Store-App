import { useMemo, useState } from 'react';
import { DEFAULT_STATE_METRIC, STATE_METRICS } from '@/configs/geo';
import type { StateBreakdownRow } from '@/types/dashboard.types';
import type { StateMetric } from '@/types/state-map.types';
import { formatStateMetric, toStateMapData } from '@/utils/state-map';

const definitionOf = (metric: StateMetric) =>
  STATE_METRICS.find((definition) => definition.value === metric) ?? STATE_METRICS[0];

export const useStateMetric = (rows: StateBreakdownRow[], initialMetric: StateMetric = DEFAULT_STATE_METRIC) => {
  const [metric, setMetric] = useState<StateMetric>(initialMetric);
  const definition = definitionOf(metric);
  const data = useMemo(() => toStateMapData(rows, definition), [rows, definition]);

  return {
    metric,
    setMetric,
    definition,
    data,
    detailLabel: metric === 'orders' ? 'GMV' : 'Orders',
    formatValue: (value: number) => formatStateMetric(definition, value),
  };
};
