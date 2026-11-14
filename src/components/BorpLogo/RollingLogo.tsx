// Welcome-screen logo intro: the rider and wheelchair roll in together from the left, the speed
// lines stretch out behind them and snap back as they brake, they tip forward from the momentum and
// settle, then the BORP letters rise into place. Once landed, the rider keeps cruising gently
// forward and back with the speed lines breathing.
//
// Only the person (body, head, hub) tips forward on the brake. The trail (speed lines + tail) and the
// wheel stay level and planted — they're one connected shape, so they never come apart.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spring } from '@/styles/theme';
import {
  fromCentre,
  NEVER,
  out,
  SpeedLines,
  useWordmark,
  Wordmark,
} from './animation';
import { PathsLayer, RIDER_PATHS, WHEEL_TRAIL_PATHS } from './parts';
import { HUB } from './paths';

type Props = {
  size: number;
  color?: string;
  /** Pauses the idle cruise, e.g. while another screen covers the welcome screen. */
  paused?: boolean;
  /** Called once the wordmark has landed (immediately when Reduce Motion is on). */
  onDone?: () => void;
};

// Timeline (ms)
const ROLL = 1000; // roll in from off-screen left and brake
const LINES_RETRACT_AT = 600; // speed lines shrink back as the rider slows
const BRAKE_AT = 820; // the person tips forward from momentum, then settles
const WORDMARK_AT = 980;
const DONE_AT = 1500;

// Idle cruise once landed
const CRUISE_MS = 2800; // one forward-or-back drift
const CRUISE_DISTANCE = 0.025; // × logo size
const CRUISE_LINES = 1.15; // speed lines stretch to this as the rider drifts forward

export function RollingLogo({
  size,
  color = colors.white,
  paused = false,
  onDone,
}: Props) {
  const reduceMotion = useReducedMotion();
  const init = (moving: number, rest: number) => (reduceMotion ? rest : moving);
  const roll = useSharedValue(init(0, 1));
  const lines = useSharedValue(init(2.4, 1));
  const linesOpacity = useSharedValue(init(0, 1));
  const lean = useSharedValue(0);
  const cruise = useSharedValue(0);
  const [landed, setLanded] = useState(reduceMotion);
  const { letters, rise } = useWordmark(reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      onDone?.();
      return;
    }
    roll.set(
      withTiming(1, { duration: ROLL, easing: out, reduceMotion: NEVER }),
    );
    linesOpacity.set(withTiming(1, { duration: 140, reduceMotion: NEVER }));
    lines.set(
      withDelay(
        LINES_RETRACT_AT,
        withTiming(1, {
          duration: 480,
          easing: Easing.out(Easing.quad),
          reduceMotion: NEVER,
        }),
      ),
    );
    lean.set(
      withDelay(
        BRAKE_AT,
        withSequence(
          withTiming(7, {
            duration: 170,
            easing: Easing.out(Easing.quad),
            reduceMotion: NEVER,
          }),
          withSpring(0, { ...spring.pop, reduceMotion: NEVER }),
        ),
      ),
    );
    rise(WORDMARK_AT);
    const t = setTimeout(() => {
      setLanded(true);
      onDone?.();
    }, DONE_AT);
    return () => clearTimeout(t);
  }, []);

  // Idle cruise: drift forward and back, speed lines stretching a little as the rider moves forward
  useEffect(() => {
    if (!landed || paused || reduceMotion) return;
    const timing = {
      duration: CRUISE_MS,
      easing: Easing.inOut(Easing.sin),
      reduceMotion: NEVER,
    };
    cruise.set(withRepeat(withTiming(1, timing), -1, true));
    lines.set(withRepeat(withTiming(CRUISE_LINES, timing), -1, true));
    return () => {
      // Ease back to rest so the cruise restarts cleanly next time
      cancelAnimation(cruise);
      cancelAnimation(lines);
      cruise.set(withTiming(0, { duration: 300, reduceMotion: NEVER }));
      lines.set(withTiming(1, { duration: 300, reduceMotion: NEVER }));
    };
  }, [landed, paused, reduceMotion, cruise, lines]);

  const travel = size * 1.65; // far enough to start fully off-screen
  const hubX = fromCentre(HUB.x, size);
  const hubY = fromCentre(HUB.y, size);
  const markStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          (roll.value - 1) * travel + cruise.value * size * CRUISE_DISTANCE,
      },
    ],
  }));
  // The person tips forward around the hub
  const leanStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: hubX },
      { translateY: hubY },
      { rotate: `${lean.value}deg` },
      { translateX: -hubX },
      { translateY: -hubY },
    ],
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Borp"
    >
      <Animated.View style={[StyleSheet.absoluteFill, markStyle]}>
        <SpeedLines
          stretch={lines}
          opacity={linesOpacity}
          size={size}
          color={color}
        />
        <PathsLayer size={size} color={color} paths={WHEEL_TRAIL_PATHS} />
        <Animated.View style={[StyleSheet.absoluteFill, leanStyle]}>
          <PathsLayer size={size} color={color} paths={RIDER_PATHS} />
        </Animated.View>
      </Animated.View>
      <Wordmark letters={letters} size={size} color={color} />
    </View>
  );
}
