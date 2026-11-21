import type { TrailGeometry } from '@/lib/trailGeometry';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import colors from '@/styles/colors';

type TrailMapProps = {
  geometry: TrailGeometry;
  // Point on the trail the directions go to
  marker?: { lat: number; lng: number };
  height?: number;
};

// Extra room around the trail so its ends aren't flush with the map's edges
const PADDING = 1.4;

// The trail drawn over a real, pannable and zoomable map. Uses Apple Maps on
// iOS and Google Maps on Android; both are free for in-app maps.
export default function TrailMap({
  geometry,
  marker,
  height = 220,
}: TrailMapProps) {
  const segments = useMemo(
    () =>
      geometry.map(seg =>
        seg.map(([latitude, longitude]) => ({ latitude, longitude })),
      ),
    [geometry],
  );

  // Starts zoomed to fit the whole trail
  const initialRegion = useMemo(() => {
    const points = geometry.flat();
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * PADDING, 0.002),
      longitudeDelta: Math.max((maxLng - minLng) * PADDING, 0.002),
    };
  }, [geometry]);

  return (
    <View
      style={[styles.frame, { height }]}
      accessibilityLabel="Map of the trail's route"
    >
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {segments.map((coordinates, i) => (
          <Polyline
            key={i}
            coordinates={coordinates}
            strokeColor={colors.navy}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ))}
        {marker && (
          <Marker
            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            title="Directions point"
            pinColor={colors.blue}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.photoPlaceholder,
  },
});
