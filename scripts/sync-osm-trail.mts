// Imports one trail from OpenStreetMap (via the Overpass API) into the `sites` table.
//
// Usage:
//   node --experimental-strip-types --env-file=.env scripts/sync-osm-trail.mts <relation|way> <id> [--dry-run]
//
// Example (Cerrito Creek Trail, El Cerrito):
//   node --experimental-strip-types --env-file=.env scripts/sync-osm-trail.mts relation 14934373 --dry-run
//
// --dry-run prints the row without touching the database. A real run needs, in .env:
//   EXPO_PUBLIC_SUPABASE_URL   (already there for the app)
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase dashboard > Project Settings > API keys. Server-only:
//                               never prefix it with EXPO_PUBLIC_ or it ships inside the app)
//   OSM_SYNC_USER_ID           (a profiles.id that imported trails are credited to)
//
// Find a trail's id on openstreetmap.org: search the trail, click it, and the URL ends in
// /relation/<id> or /way/<id>. Hiking routes are usually relations; short paths are ways.

import { createClient } from '@supabase/supabase-js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

type OsmType = 'way' | 'relation';
type LatLng = [number, number];
type Tags = Record<string, string>;
type OverpassElement = {
  type: string;
  id: number;
  tags?: Tags;
  geometry?: { lat: number; lon: number }[];
};

// Per-segment tags worth keeping a summary of (accessibility, mostly)
const SEGMENT_KEYS = [
  'surface',
  'smoothness',
  'wheelchair',
  'incline',
  'width',
  'highway',
  'access',
];

async function fetchFromOverpass(type: OsmType, id: number) {
  // `out geom` returns each way's tags plus its coordinates in one request
  const query =
    type === 'relation'
      ? `[out:json][timeout:60];relation(${id});out tags;way(r);out geom;`
      : `[out:json][timeout:60];way(${id});out geom;`;

  // The public server is busy at times; retry 502/503/504 a few times
  let res: Response;
  for (let attempt = 1; ; attempt++) {
    res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'trail-sync-script/0.1',
      },
      body: new URLSearchParams({ data: query }),
    });
    if (![502, 503, 504].includes(res.status) || attempt === 3) break;
    console.warn(`Overpass returned ${res.status}, retrying...`);
    await new Promise(r => setTimeout(r, attempt * 5000));
  }
  if (res.status === 429)
    throw new Error('Overpass rate limit hit; wait a minute and try again.');
  if (!res.ok) throw new Error(`Overpass returned ${res.status}`);

  const json = (await res.json()) as { elements: OverpassElement[] };
  const root = json.elements.find(e => e.type === type && e.id === id);
  const ways = json.elements.filter(e => e.type === 'way' && e.geometry);
  if (!root) throw new Error(`No OSM ${type} with id ${id}.`);
  if (ways.length === 0)
    throw new Error(`OSM ${type} ${id} has no path geometry.`);
  return { tags: root.tags ?? {}, ways };
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

function distanceM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

// sites.surface_type only allows the app's categories (SITE_SURFACES in
// src/lib/siteForm.ts); this maps OSM's many surface values onto them
const SURFACE_CATEGORIES: Record<string, string[]> = {
  Paved: [
    'paved',
    'asphalt',
    'concrete',
    'concrete:plates',
    'concrete:lanes',
    'paving_stones',
    'sett',
    'bricks',
    'metal',
    'rubber',
    'tartan',
  ],
  Boardwalk: ['wood', 'boardwalk'],
  Gravel: ['gravel', 'fine_gravel', 'compacted', 'pebblestone', 'rock'],
  Dirt: [
    'dirt',
    'ground',
    'earth',
    'mud',
    'unpaved',
    'grass',
    'sand',
    'woodchips',
  ],
};

function surfaceCategory(osmSurface: string | undefined) {
  if (!osmSurface) return null;
  for (const [category, values] of Object.entries(SURFACE_CATEGORIES))
    if (values.includes(osmSurface)) return category;
  return 'Other';
}

function buildRow(
  type: OsmType,
  id: number,
  tags: Tags,
  ways: OverpassElement[],
) {
  const name = tags.name ?? ways.find(w => w.tags?.name)?.tags?.name;
  if (!name) throw new Error(`OSM ${type} ${id} has no name tag.`);

  const geometry: LatLng[][] = ways.map(w =>
    w.geometry!.map(p => [round(p.lat), round(p.lon)] as LatLng),
  );
  const points = geometry.flat();

  // Location is a point ON the trail nearest its bounding-box center. A plain
  // center can land off-trail for curvy routes, which breaks directions.
  const lats = points.map(p => p[0]);
  const lngs = points.map(p => p[1]);
  const mid: LatLng = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const [lat, lng] = points.reduce((best, p) =>
    distanceM(p, mid) < distanceM(best, mid) ? p : best,
  );

  const segLengths = geometry.map(seg =>
    seg.slice(1).reduce((s, p, i) => s + distanceM(seg[i], p), 0),
  );
  const lengthM = segLengths.reduce((a, b) => a + b, 0);

  // The category covering the most distance; the route's own tag wins if set
  const metersBySurface = new Map<string, number>();
  ways.forEach((w, i) => {
    const category = surfaceCategory(w.tags?.surface);
    if (category)
      metersBySurface.set(
        category,
        (metersBySurface.get(category) ?? 0) + segLengths[i],
      );
  });
  const mainSurface =
    surfaceCategory(tags.surface) ??
    [...metersBySurface].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  // Every distinct value each segment key takes, e.g. surface: ['compacted', 'paved']
  const segmentValues: Record<string, string[]> = {};
  for (const key of SEGMENT_KEYS) {
    const values = [...new Set(ways.map(w => w.tags?.[key]).filter(Boolean))];
    if (values.length) segmentValues[key] = values as string[];
  }

  return {
    name,
    lat,
    lng,
    surface_type: mainSurface,
    trail_length_m: Math.round(lengthM),
    osm_type: type,
    osm_id: id,
    geometry,
    osm_tags: { tags, segments: segmentValues },
    osm_synced_at: new Date().toISOString(),
  };
}

async function main() {
  const [typeArg, idArg] = process.argv.slice(2);
  const dryRun = process.argv.includes('--dry-run');
  const id = Number(idArg);
  if ((typeArg !== 'relation' && typeArg !== 'way') || !Number.isInteger(id)) {
    console.error(
      'Usage: scripts/sync-osm-trail.mts <relation|way> <id> [--dry-run]',
    );
    process.exit(1);
  }

  const { tags, ways } = await fetchFromOverpass(typeArg, id);
  const row = buildRow(typeArg, id, tags, ways);

  const pointCount = row.geometry.flat().length;
  console.log(
    JSON.stringify(
      {
        ...row,
        geometry: `${row.geometry.length} segments, ${pointCount} points`,
      },
      null,
      2,
    ),
  );
  console.log(
    `Directions: https://www.google.com/maps/dir/?api=1&destination=${row.lat},${row.lng}&travelmode=walking`,
  );
  if (dryRun) return;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.OSM_SYNC_USER_ID;
  if (!url || !serviceKey || !userId)
    throw new Error(
      'Set EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and OSM_SYNC_USER_ID in .env (or use --dry-run).',
    );

  // The service role key bypasses row-level security, so this only runs server-side
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from('sites')
    .upsert({ ...row, created_by: userId }, { onConflict: 'osm_type,osm_id' })
    .select('id, name')
    .single();
  if (error) throw error;
  console.log(`Saved "${data.name}" as site ${data.id}`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
