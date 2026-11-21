import type { Json } from '~/api/supabase/database.types';

// A trail's shape from OpenStreetMap: segments of [lat, lng] points.
// Segments aren't necessarily in walking order, so draw each one separately.
export type TrailGeometry = [number, number][][];

// The `geometry` column is untyped jsonb; returns null unless it has the expected shape
export function parseGeometry(value: Json | null): TrailGeometry | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const isPoint = (p: unknown) =>
    Array.isArray(p) &&
    p.length === 2 &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number';
  const ok = value.every(seg => Array.isArray(seg) && seg.every(isPoint));
  return ok ? (value as TrailGeometry) : null;
}

// Opens Google Maps (app or web) with walking directions. Free, no API key.
export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
