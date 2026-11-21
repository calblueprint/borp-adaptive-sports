import type { TrailGeometry } from '@/lib/trailGeometry';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import colors from '@/styles/colors';

type TrailShapeProps = {
  geometry: TrailGeometry;
  // Point on the trail the directions go to; marked with a dot
  marker?: { lat: number; lng: number };
  height?: number;
};

const SIZE = 1000; // viewBox units; the Svg scales this to fit
const PAD = 60;

// Draws the trail's outline with no map underneath. Needs no API key or new
// dependency, but is a static picture: no panning, zooming or streets.
export default function TrailShape({
  geometry,
  marker,
  height = 180,
}: TrailShapeProps) {
  const points = geometry.flat();
  const lats = points.map(p => p[0]);
  const lngs = points.map(p => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // A degree of longitude shrinks away from the equator; scale it so the
  // shape isn't stretched sideways
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLng - minLng) * lngScale || 1e-9;
  const spanY = maxLat - minLat || 1e-9;
  const scale = (SIZE - 2 * PAD) / Math.max(spanX, spanY);
  // Center the shape in the square
  const offX = (SIZE - spanX * scale) / 2;
  const offY = (SIZE - spanY * scale) / 2;

  const toXY = (lat: number, lng: number) => ({
    x: offX + (lng - minLng) * lngScale * scale,
    y: offY + (maxLat - lat) * scale, // SVG y grows downward; north stays up
  });

  const dot = marker && toXY(marker.lat, marker.lng);

  return (
    <View
      style={[styles.frame, { height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Outline of the trail's route"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {geometry.map((seg, i) => (
          <Polyline
            key={i}
            points={seg
              .map(([lat, lng]) => {
                const { x, y } = toXY(lat, lng);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={colors.navy}
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {dot && (
          <Circle
            cx={dot.x}
            cy={dot.y}
            r={24}
            fill={colors.blue}
            stroke={colors.white}
            strokeWidth={8}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.photoPlaceholder,
    overflow: 'hidden',
  },
});
