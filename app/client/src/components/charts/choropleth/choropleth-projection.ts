import {
  type GeoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
  geoGraticule,
  geoMercator,
  geoPath,
} from 'd3-geo';
import type { MultiLineString } from 'geojson';

export interface ChoroplethMercator {
  path: GeoPath<unknown, GeoPermissibleObjects>;
  projection: GeoProjection;
}

interface ChoroplethMercatorConfig {
  scale?: number;
  translate?: [number, number];
  center?: [number, number];
}

export function createChoroplethMercator({ scale, translate, center }: ChoroplethMercatorConfig): ChoroplethMercator {
  const projection = geoMercator();
  if (scale) {
    projection.scale(scale);
  }
  if (translate) {
    projection.translate(translate);
  }
  if (center) {
    projection.center(center);
  }
  return { path: geoPath(projection), projection };
}

export function projectFeaturePaths(
  mercator: ChoroplethMercator,
  features: readonly GeoPermissibleObjects[]
): (string | null)[] {
  return features.map((feature) => mercator.path(feature) ?? null);
}

export function graticulePath(
  path: (object: MultiLineString) => string | null | undefined,
  step?: [number, number]
): string {
  const graticule = geoGraticule();
  if (step) {
    graticule.step(step);
  }
  return path(graticule()) || '';
}
