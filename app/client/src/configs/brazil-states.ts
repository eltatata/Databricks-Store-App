import type { FeatureCollection, Geometry } from 'geojson';
import rawBrazilStates from '@/assets/geo/brazil-states.json';

export interface BrazilStateProperties {
  id: string;
  name: string;
  [key: string]: unknown;
}

export type BrazilStatesCollection = FeatureCollection<Geometry, BrazilStateProperties>;

const isBrazilStatesCollection = (value: unknown): value is BrazilStatesCollection =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  value.type === 'FeatureCollection' &&
  'features' in value &&
  Array.isArray(value.features);

const loadBrazilStates = (value: unknown): BrazilStatesCollection => {
  if (!isBrazilStatesCollection(value)) {
    throw new Error('The Brazil states GeoJSON is not a FeatureCollection');
  }
  return value;
};

export const BRAZIL_STATES = loadBrazilStates(rawBrazilStates);

export const BRAZIL_STATE_NAMES = new Map(
  BRAZIL_STATES.features.map((feature) => [feature.properties.id, feature.properties.name])
);
