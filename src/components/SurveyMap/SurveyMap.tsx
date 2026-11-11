// The top of the profile: every trail you've surveyed, as its photo on one map of the Bay Area, like the
// Places map in Apple Photos. The map is the "how much have I done" picture, so the page needs no stat row.
// The survey BORP sent back carries the navy "!" and sits on top. Markers pop in once, in date order.
import type { Trail } from '@/data/trails';
import { Image, Pressable, View } from 'react-native';
import Animated, { useReducedMotion, ZoomIn } from 'react-native-reanimated';
import { TrailSnapshot } from '@/components/TrailImage/TrailImage';
import { AttentionMark } from '@/components/TrailStatus/TrailStatus';
import { BAY_MAP, BAY_SIZE, BAY_TRAILHEADS } from '@/data/bay-map';
import { TRAIL_PHOTOS } from '@/data/trail-photos';
import { spring } from '@/styles/theme';
import styles, { BADGE, MARKER } from './styles';

export type MapSurvey = {
  id: string;
  trail: Trail;
  needsYou: boolean;
  label: string;
};

/** Fills width × height like `cover`, and places each trailhead with the same maths. */
export function SurveyMap({
  width,
  height,
  surveys,
  onPress,
}: {
  width: number;
  height: number;
  surveys: MapSurvey[];
  onPress: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = Math.max(width / BAY_SIZE.width, height / BAY_SIZE.height);
  const w = BAY_SIZE.width * scale;
  const h = BAY_SIZE.height * scale;
  const left = (width - w) / 2;
  const top = (height - h) / 2;
  // One marker per trail (the latest survey), the one that needs you drawn last so it's on top
  const seen = new Set<string>();
  const markers = surveys.filter(
    s =>
      BAY_TRAILHEADS[s.trail.id] &&
      !seen.has(s.trail.id) &&
      seen.add(s.trail.id),
  );
  markers.sort((a, b) => Number(a.needsYou) - Number(b.needsYou));

  return (
    <View style={{ width, height, overflow: 'hidden' }} accessible={false}>
      <Image
        source={BAY_MAP}
        style={{ position: 'absolute', left, top, width: w, height: h }}
        accessibilityIgnoresInvertColors
      />
      {markers.map((s, i) => {
        const [fx, fy] = BAY_TRAILHEADS[s.trail.id];
        const photo = TRAIL_PHOTOS[s.trail.id]?.image;
        return (
          <Animated.View
            key={s.trail.id}
            entering={
              reduceMotion
                ? undefined
                : ZoomIn.delay(160 + i * 90)
                    .springify(spring.pop.duration)
                    .dampingRatio(spring.pop.dampingRatio)
            }
            style={[
              styles.marker,
              {
                left: left + fx * w - MARKER / 2,
                top: top + fy * h - MARKER / 2,
              },
            ]}
          >
            <Pressable
              onPress={() => onPress(s.id)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              style={({ pressed }) => [styles.face, pressed && styles.pressed]}
            >
              {photo ? (
                <Image
                  source={photo}
                  style={styles.photo}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <TrailSnapshot trail={s.trail} variant="thumb" />
              )}
            </Pressable>
            {s.needsYou ? (
              <View style={styles.badge} pointerEvents="none">
                <AttentionMark size={BADGE} />
              </View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}
