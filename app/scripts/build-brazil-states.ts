import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_1_states_provinces.geojson';
const OUTPUT_PATH = resolve(import.meta.dirname, '../client/src/assets/geo/brazil-states.json');
const COORDINATE_DECIMALS = 3;
const EXPECTED_STATES = 27;

interface NaturalEarthProperties {
  adm0_a3: string;
  postal: string;
  name: string;
}

interface BrazilStateProperties {
  id: string;
  name: string;
}

const roundCoordinate = (value: number) => Number(value.toFixed(COORDINATE_DECIMALS));

const roundPositions = (positions: unknown): unknown =>
  Array.isArray(positions) && typeof positions[0] === 'number'
    ? (positions as Position).map(roundCoordinate)
    : (positions as unknown[]).map(roundPositions);

const roundGeometry = (geometry: Geometry): Geometry => {
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return { ...geometry, coordinates: roundPositions(geometry.coordinates) } as Geometry;
  }
  throw new Error(`Unexpected geometry type ${geometry.type}`);
};

const toBrazilState = (
  feature: Feature<Geometry, NaturalEarthProperties>
): Feature<Geometry, BrazilStateProperties> => ({
  type: 'Feature',
  id: feature.properties.postal,
  properties: { id: feature.properties.postal, name: feature.properties.name },
  geometry: roundGeometry(feature.geometry),
});

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Natural Earth download failed with HTTP ${response.status}`);
  }
  const source = (await response.json()) as FeatureCollection<Geometry, NaturalEarthProperties>;
  const states = source.features
    .filter((feature) => feature.properties.adm0_a3 === 'BRA')
    .map(toBrazilState)
    .sort((left, right) => left.properties.id.localeCompare(right.properties.id));

  if (states.length !== EXPECTED_STATES) {
    throw new Error(`Expected ${EXPECTED_STATES} Brazilian states, found ${states.length}`);
  }

  const collection: FeatureCollection<Geometry, BrazilStateProperties> = {
    type: 'FeatureCollection',
    features: states,
  };
  await writeFile(OUTPUT_PATH, `${JSON.stringify(collection)}\n`);
  console.log(`Wrote ${states.length} states to ${OUTPUT_PATH}`);
}

await main();
