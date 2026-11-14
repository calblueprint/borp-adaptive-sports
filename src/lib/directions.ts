// Directions to a trail's trailhead in the person's own maps app, where they already see how far it is from
// home and how long it takes. Universal links, so it opens the app when installed and the web otherwise.
import type { Trail } from '@/data/trails';
import { Linking, Platform } from 'react-native';

export type MapsApp = 'apple' | 'google';

/** Android has no Apple Maps, so it goes straight to Google Maps without asking. */
export const MAPS_APPS: { key: MapsApp; label: string }[] =
  Platform.OS === 'android'
    ? [{ key: 'google', label: 'Google Maps' }]
    : [
        { key: 'apple', label: 'Apple Maps' },
        { key: 'google', label: 'Google Maps' },
      ];

export function mapsUrl(
  trail: Pick<Trail, 'lat' | 'lng' | 'name'>,
  app: MapsApp,
) {
  const at = `${trail.lat},${trail.lng}`;
  return app === 'apple'
    ? `https://maps.apple.com/?daddr=${at}&q=${encodeURIComponent(trail.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${at}`;
}

export const openInMaps = (
  trail: Pick<Trail, 'lat' | 'lng' | 'name'>,
  app: MapsApp,
) => Linking.openURL(mapsUrl(trail, app));
