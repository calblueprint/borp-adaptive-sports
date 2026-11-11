// A small glass pull-down menu, like iOS 26's: it grows out of the button that opened it, with a check by
// the current choice. Tapping outside or picking closes it. Replaces the action sheet that slid up from the
// bottom of the screen for what is a two-option choice next to the button.
import { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass/Glass';
import { Icon } from '@/components/Icon/Icon';
import { colors, spring } from '@/styles/theme';
import styles, { PAD, ROW, WIDTH } from './styles';

/** Where the opening button is, in window coordinates (from measureInWindow). */
export type Anchor = { x: number; y: number; width: number; height: number };

const EDGE = 16;

type Props<T extends string> = {
  anchor: Anchor;
  options: { key: T; label: string }[];
  /** The current choice, checked. Leave out for a menu of actions (e.g. which maps app). */
  value?: T;
  onChange: (value: T) => void;
  /** Called once the menu has finished closing; unmount it then. */
  onClose: () => void;
  accessibilityLabel: string;
};

/** Render while open; it animates itself in, and out before calling onClose. */
export function PullDownMenu<T extends string>({
  anchor,
  options,
  value,
  onChange,
  onClose,
  accessibilityLabel,
}: Props<T>) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const s = useSharedValue(reduceMotion ? 1 : 0);
  const height = PAD * 2 + ROW * options.length;

  useEffect(() => {
    if (!reduceMotion) s.set(withSpring(1, spring.pop));
  }, [reduceMotion, s]);

  const close = () => {
    if (reduceMotion) return onClose();
    s.set(
      withTiming(
        0,
        { duration: 160, easing: Easing.in(Easing.cubic) },
        done => done && runOnJS(onClose)(),
      ),
    );
  };
  const pick = (key: T) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (key !== value) onChange(key);
    close();
  };

  // Just under the button, lined up with its outer edge: a button on the left opens rightwards. Low on
  // the screen (no room below), it opens upwards instead
  const fromLeft = anchor.x + anchor.width / 2 < screenW / 2;
  const left = Math.max(
    EDGE,
    Math.min(
      fromLeft ? anchor.x : anchor.x + anchor.width - WIDTH,
      screenW - EDGE - WIDTH,
    ),
  );
  const up = anchor.y + anchor.height + 4 + height > screenH - EDGE;
  const top = up ? anchor.y - 4 - height : anchor.y + anchor.height + 4;

  // Grows from the top corner nearest the button. Translate → scale → translate back instead of a
  // percentage transformOrigin (unreliable on iPhone). Scale only on the glass: opacity below 1 stops Liquid Glass
  const dx = fromLeft ? -WIDTH / 2 : WIDTH / 2;
  const grow = useAnimatedStyle(() => {
    const k = interpolate(s.get(), [0, 1], [0.3, 1]);
    const dy = up ? height / 2 : -height / 2;
    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { scale: k },
        { translateX: -dx },
        { translateY: -dy },
      ],
    };
  });
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(s.get(), [0.4, 1], [0, 1], 'clamp'),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={close}
        accessibilityLabel="Close menu"
        accessibilityRole="button"
      />
      <Glass radius={22} style={[styles.menu, { left, top, height }, grow]}>
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={[styles.list, content]}
        >
          {options.map(o => {
            const on = o.key === value;
            return (
              <Pressable
                key={o.key}
                onPress={() => pick(o.key)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                {value !== undefined ? (
                  <View style={styles.check}>
                    {on ? (
                      <Icon
                        name="check"
                        size={18}
                        color={colors.ink}
                        strokeWidth={2.2}
                      />
                    ) : null}
                  </View>
                ) : null}
                <Text style={styles.label}>{o.label}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
      </Glass>
    </View>
  );
}
