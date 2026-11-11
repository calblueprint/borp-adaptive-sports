import { useEffect } from 'react';
import { View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/styles/theme';
import { NEVER, SpeedLines } from './animation';
import { MARK_PATHS, PathsLayer } from './parts';

type Props = { size?: number; color?: string };

// Square crop of the 1024² logo around the rider, wheelchair and speed lines (no wordmark)
const CROP = { x: 130, y: 110, s: 640 };
const MAX_STRETCH = 1.8;

/**
 * Loading indicator: the Borp rider "rolls in place" — the rider stays still while the speed lines
 * stretch out and back. With Reduce Motion on, it pulses more slowly rather than stopping.
 */
export function RollingLoader({ size = 28, color = colors.white }: Props) {
  const reduceMotion = useReducedMotion();
  const stretch = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    stretch.set(
      withRepeat(
        withTiming(MAX_STRETCH, {
          duration: reduceMotion ? 1400 : 550,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: NEVER,
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(stretch);
  }, [stretch, reduceMotion]);

  // Render the full logo scaled up, offset so only the crop shows
  const scale = size / CROP.s;
  const full = 1024 * scale;

  return (
    <View
      style={{ width: size, height: size, overflow: 'hidden' }}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <View
        style={{
          position: 'absolute',
          left: -CROP.x * scale,
          top: -CROP.y * scale,
          width: full,
          height: full,
        }}
      >
        <SpeedLines
          stretch={stretch}
          opacity={opacity}
          size={full}
          color={color}
        />
        <PathsLayer size={full} color={color} paths={MARK_PATHS} />
      </View>
    </View>
  );
}
