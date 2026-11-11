// Animation building blocks for the logo intro and loader.
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { PathsLayer, SpeedLineLayer } from './parts';
import { LOGO_PATHS, SPEED_LINES } from './paths';

/** Reduce Motion is handled explicitly (the logo starts in its end state), so animations never auto-skip. */
export const NEVER = ReduceMotion.Never;
export const out = Easing.out(Easing.cubic);

/**
 * Distance in points from the centre of a `size`-wide logo view to logo coordinate `v` (0–1024).
 * Used to scale/rotate around a point with translate → transform → translate back, which behaves
 * the same on iOS, Android and web (unlike percentage transform origins).
 */
export const fromCentre = (v: number, size: number) => (v / 1024 - 0.5) * size;

/** Shared values for the B / OR / P letters; call `rise(at)` to animate them in. */
export function useWordmark(reduceMotion: boolean) {
  const b = useSharedValue(reduceMotion ? 1 : 0);
  const or = useSharedValue(reduceMotion ? 1 : 0);
  const p = useSharedValue(reduceMotion ? 1 : 0);
  const letters = [b, or, p];
  const rise = (at: number) =>
    letters.forEach((l, i) =>
      l.set(
        withDelay(
          at + i * 70,
          withTiming(1, { duration: 380, easing: out, reduceMotion: NEVER }),
        ),
      ),
    );
  return { letters, rise };
}

export function Wordmark({
  letters,
  size,
  color,
}: {
  letters: SharedValue<number>[];
  size: number;
  color: string;
}) {
  const paths = [LOGO_PATHS.letterB, LOGO_PATHS.letterOR, LOGO_PATHS.letterP];
  return (
    <>
      {paths.map((d, i) => (
        <Letter key={i} d={d} progress={letters[i]} size={size} color={color} />
      ))}
    </>
  );
}

function Letter({
  d,
  progress,
  size,
  color,
}: {
  d: string;
  progress: SharedValue<number>;
  size: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * size * 0.06 }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <PathsLayer size={size} color={color} paths={[d]} />
    </Animated.View>
  );
}

type SpeedLinesProps = {
  stretch: SharedValue<number>;
  opacity: SharedValue<number>;
  size: number;
  color: string;
};

/** The three speed lines, each stretching out from where it meets the wheel. */
export function SpeedLines(props: SpeedLinesProps) {
  return (
    <>
      {SPEED_LINES.map((line, i) => (
        <SpeedLine key={i} index={i} attachX={line.attachX} {...props} />
      ))}
    </>
  );
}

type SpeedLineProps = SpeedLinesProps & { index: number; attachX: number };

/** A speed line that stretches horizontally from where it meets the wheel. It never tilts or moves vertically. */
function SpeedLine({
  index,
  attachX,
  stretch,
  opacity,
  size,
  color,
}: SpeedLineProps) {
  const anchor = fromCentre(attachX, size);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: anchor },
      { scaleX: stretch.value },
      { translateX: -anchor },
    ],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <SpeedLineLayer index={index} size={size} color={color} />
    </Animated.View>
  );
}
