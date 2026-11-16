import { STATE_METRICS } from '@/configs/geo';
import type { StateMetric } from '@/types/state-map.types';
import { SegmentedControl } from './SegmentedControl';

interface StateMetricSwitchProps {
  value: StateMetric;
  onChange: (metric: StateMetric) => void;
  accentId: string;
}

export function StateMetricSwitch({ value, onChange, accentId }: StateMetricSwitchProps) {
  return (
    <SegmentedControl<StateMetric>
      label="Map metric"
      options={STATE_METRICS}
      value={value}
      onChange={onChange}
      accentId={accentId}
      size="sm"
    />
  );
}
