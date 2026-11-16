export type StateMetric = 'gmv' | 'orders' | 'averageOrderValue' | 'freight';

export interface StateMetricDefinition {
  value: StateMetric;
  label: string;
  format: 'currency' | 'count';
}

export interface StateMapDatum {
  state: string;
  value: number;
  detail: string | null;
}

export interface StateMapStep {
  color: string;
  min: number;
  max: number;
}
