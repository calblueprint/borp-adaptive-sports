import type { Tables } from '~/api/supabase/database.types';

export type Site = Pick<Tables<'sites'>, 'id' | 'name' | 'lat' | 'lng'>;

// Matches "lat, lng", e.g. "37.87, -122.27"
const COORDS = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function searchSites(sites: Site[], query: string): Site[] {
  const q = query.trim();
  if (!q) return sites;

  const match = q.match(COORDS);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    return [...sites]
      .sort(
        (a, b) =>
          distanceKm(lat, lng, a.lat, a.lng) -
          distanceKm(lat, lng, b.lat, b.lng),
      )
      .slice(0, 3);
  }

  const needle = q.toLowerCase();
  return sites.filter(site => site.name.toLowerCase().includes(needle));
}
