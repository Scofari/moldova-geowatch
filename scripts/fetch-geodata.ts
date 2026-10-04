import { mkdir, writeFile } from 'node:fs/promises';
import type {
  FeatureCollection,
  Feature,
  Polygon,
  MultiPolygon,
  Point,
} from 'geojson';
import type { RiverFeature } from '@geowatch/shared';
// Explicit version tag; update deliberately after reviewing upstream changes.
const revision = 'v5.1.2';
const base =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/' +
  revision +
  '/geojson/';
async function load(name: string): Promise<FeatureCollection> {
  const response = await fetch(base + name + '.geojson', {
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(name + ': HTTP ' + response.status);
  return (await response.json()) as FeatureCollection;
}
const [countries, rivers, places] = await Promise.all([
  load('ne_10m_admin_0_countries'),
  load('ne_10m_rivers_lake_centerlines'),
  load('ne_10m_populated_places'),
]);
const border = countries.features.find(
  (f) => f.properties?.ADM0_A3 === 'MDA',
) as Feature<Polygon | MultiPolygon> | undefined;
if (!border) throw new Error('Moldova boundary not found.');
const selected = rivers.features.filter((f) =>
  /^(dniester|dnestr|prut)$/i.test(String(f.properties?.name)),
);
if (
  !selected.some((f) => /prut/i.test(String(f.properties?.name))) ||
  selected.length < 2
)
  throw new Error('Both river geometries are required.');
const features = selected.map((f): RiverFeature => ({
  type: 'Feature',
  geometry: f.geometry as RiverFeature['geometry'],
  properties: {
    id: /prut/i.test(String(f.properties?.name)) ? 'prut' : 'dniester',
    name: /prut/i.test(String(f.properties?.name))
      ? 'Prut'
      : 'Nistru / Dniester',
    alternateNames: /prut/i.test(String(f.properties?.name))
      ? ['Prut']
      : ['Nistru', 'Dniester', 'Dnestr'],
  },
}));
const cities = places.features
  .filter((f) => f.properties?.ADM0_A3 === 'MDA')
  .map((f) => {
    const coords = (f.geometry as Point).coordinates;
    const raw = String(f.properties?.NAME);
    return {
      name: raw === 'Chisinau' ? 'Chișinău' : raw,
      position: { latitude: coords[1], longitude: coords[0] },
    };
  });
const retrievedAt = new Date().toISOString();
const source = {
  provider: 'Natural Earth 1:10m',
  url: 'https://www.naturalearthdata.com/',
  license: 'Public domain',
  mode: 'STATIC',
  retrievedAt,
  notes:
    'Generalized cartographic geometry; upstream revision ' +
    revision +
    '. Not navigation-grade.',
};
await mkdir('apps/api/data', { recursive: true });
await mkdir('apps/web/public/data', { recursive: true });
await writeFile(
  'apps/api/data/md-rivers.json',
  JSON.stringify({ features, source }),
);
await writeFile(
  'apps/web/public/data/md-geography.json',
  JSON.stringify({ border, cities, source }),
);
await writeFile(
  'apps/api/data/provenance.json',
  JSON.stringify(
    {
      revision,
      retrievedAt,
      sources: [
        'ne_10m_admin_0_countries',
        'ne_10m_rivers_lake_centerlines',
        'ne_10m_populated_places',
      ].map((n) => base + n + '.geojson'),
      transformations:
        'Filter country ADM0_A3=MDA, rivers by names, normalize property names; geometry retained without invented vertices.',
    },
    null,
    2,
  ),
);
console.log(
  'Imported country boundary, ' +
    cities.length +
    ' cities and ' +
    features.length +
    ' river features.',
);
