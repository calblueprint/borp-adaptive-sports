// Bay Area places bundled with the app, so picking a location works offline and on web
// (address search needs the network and only runs on iOS/Android).

export type Coords = { lat: number; lng: number };

export type Place = Coords & {
  id: string;
  name: string;
  /** Second line in the picker, e.g. the county or the city a neighborhood is in. */
  detail: string;
};

export const PLACES: Place[] = [
  {
    id: 'borp',
    name: 'BORP · Ed Roberts Campus',
    detail: 'Berkeley',
    lat: 37.8553,
    lng: -122.2697,
  },
  {
    id: 'berkeley',
    name: 'Berkeley',
    detail: 'Alameda County',
    lat: 37.8716,
    lng: -122.2727,
  },
  {
    id: 'albany',
    name: 'Albany',
    detail: 'Alameda County',
    lat: 37.8869,
    lng: -122.2978,
  },
  {
    id: 'emeryville',
    name: 'Emeryville',
    detail: 'Alameda County',
    lat: 37.8313,
    lng: -122.2852,
  },
  {
    id: 'oakland',
    name: 'Oakland',
    detail: 'Alameda County',
    lat: 37.8044,
    lng: -122.2712,
  },
  {
    id: 'rockridge',
    name: 'Rockridge',
    detail: 'Oakland',
    lat: 37.8441,
    lng: -122.2517,
  },
  {
    id: 'lake-merritt',
    name: 'Lake Merritt',
    detail: 'Oakland',
    lat: 37.8027,
    lng: -122.258,
  },
  {
    id: 'alameda',
    name: 'Alameda',
    detail: 'Alameda County',
    lat: 37.7652,
    lng: -122.2416,
  },
  {
    id: 'san-leandro',
    name: 'San Leandro',
    detail: 'Alameda County',
    lat: 37.7249,
    lng: -122.1561,
  },
  {
    id: 'castro-valley',
    name: 'Castro Valley',
    detail: 'Alameda County',
    lat: 37.6941,
    lng: -122.0864,
  },
  {
    id: 'hayward',
    name: 'Hayward',
    detail: 'Alameda County',
    lat: 37.6688,
    lng: -122.0808,
  },
  {
    id: 'union-city',
    name: 'Union City',
    detail: 'Alameda County',
    lat: 37.5934,
    lng: -122.0439,
  },
  {
    id: 'fremont',
    name: 'Fremont',
    detail: 'Alameda County',
    lat: 37.5485,
    lng: -121.9886,
  },
  {
    id: 'pleasanton',
    name: 'Pleasanton',
    detail: 'Alameda County',
    lat: 37.6624,
    lng: -121.8747,
  },
  {
    id: 'el-cerrito',
    name: 'El Cerrito',
    detail: 'Contra Costa County',
    lat: 37.9161,
    lng: -122.3108,
  },
  {
    id: 'richmond',
    name: 'Richmond',
    detail: 'Contra Costa County',
    lat: 37.9358,
    lng: -122.3478,
  },
  {
    id: 'pinole',
    name: 'Pinole',
    detail: 'Contra Costa County',
    lat: 38.0044,
    lng: -122.2989,
  },
  {
    id: 'orinda',
    name: 'Orinda',
    detail: 'Contra Costa County',
    lat: 37.8771,
    lng: -122.1797,
  },
  {
    id: 'lafayette',
    name: 'Lafayette',
    detail: 'Contra Costa County',
    lat: 37.8858,
    lng: -122.118,
  },
  {
    id: 'walnut-creek',
    name: 'Walnut Creek',
    detail: 'Contra Costa County',
    lat: 37.9101,
    lng: -122.0652,
  },
  {
    id: 'concord',
    name: 'Concord',
    detail: 'Contra Costa County',
    lat: 37.978,
    lng: -122.0311,
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    detail: 'San Francisco County',
    lat: 37.7749,
    lng: -122.4194,
  },
  {
    id: 'mission',
    name: 'Mission District',
    detail: 'San Francisco',
    lat: 37.7599,
    lng: -122.4148,
  },
  {
    id: 'sunset',
    name: 'Sunset District',
    detail: 'San Francisco',
    lat: 37.7531,
    lng: -122.494,
  },
  {
    id: 'presidio',
    name: 'Presidio',
    detail: 'San Francisco',
    lat: 37.7989,
    lng: -122.4662,
  },
  {
    id: 'daly-city',
    name: 'Daly City',
    detail: 'San Mateo County',
    lat: 37.6879,
    lng: -122.4702,
  },
  {
    id: 'san-mateo',
    name: 'San Mateo',
    detail: 'San Mateo County',
    lat: 37.563,
    lng: -122.3255,
  },
  {
    id: 'palo-alto',
    name: 'Palo Alto',
    detail: 'Santa Clara County',
    lat: 37.4419,
    lng: -122.143,
  },
  {
    id: 'san-jose',
    name: 'San Jose',
    detail: 'Santa Clara County',
    lat: 37.3382,
    lng: -121.8863,
  },
  {
    id: 'sausalito',
    name: 'Sausalito',
    detail: 'Marin County',
    lat: 37.8591,
    lng: -122.4853,
  },
  {
    id: 'mill-valley',
    name: 'Mill Valley',
    detail: 'Marin County',
    lat: 37.906,
    lng: -122.545,
  },
  {
    id: 'san-rafael',
    name: 'San Rafael',
    detail: 'Marin County',
    lat: 37.9735,
    lng: -122.5311,
  },
  {
    id: 'novato',
    name: 'Novato',
    detail: 'Marin County',
    lat: 38.1074,
    lng: -122.5697,
  },
  {
    id: 'vallejo',
    name: 'Vallejo',
    detail: 'Solano County',
    lat: 38.1041,
    lng: -122.2566,
  },
];

/** Shown in the picker before you type. */
export const SUGGESTED_PLACE_IDS = [
  'borp',
  'oakland',
  'san-francisco',
  'fremont',
  'mill-valley',
];

/** Where distances are measured from until you share your location or pick a place: BORP's home city. */
export const DEFAULT_PLACE = PLACES.find(p => p.id === 'berkeley')!;

export function searchPlaces(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Names that start with the query first, then ones that only contain it
  const starts = PLACES.filter(p => p.name.toLowerCase().startsWith(q));
  const contains = PLACES.filter(
    p =>
      !starts.includes(p) && `${p.name} ${p.detail}`.toLowerCase().includes(q),
  );
  return [...starts, ...contains];
}

/** The bundled place closest to a point, used to name your location without the network. */
export function nearestPlace(at: Coords) {
  let best = PLACES[0];
  let bestMiles = Infinity;
  for (const p of PLACES) {
    if (p.id === 'borp') continue; // name the city, not the office
    const d = milesBetween(at, p);
    if (d < bestMiles) [best, bestMiles] = [p, d];
  }
  return { place: best, miles: bestMiles };
}

/** Straight-line distance in miles (haversine). */
export function milesBetween(a: Coords, b: Coords) {
  const R = 3958.8; // Earth radius in miles
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "37.8716° N, 122.2727° W" */
export const formatCoords = ({ lat, lng }: Coords) =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
