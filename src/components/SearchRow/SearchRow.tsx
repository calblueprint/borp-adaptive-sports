// The pinned search row at the top of the Trails list, and the status filter that docks into it.
// The filter lives in the row of pull-downs under the search field. Scrolled up under the field, it docks
// into this row as a glass chip ("Resurvey due ⌄"), the same glass as the search field and the dock, while the field narrows to make room: search never
// leaves the top, the filter joins it. The chip opens the same pull-down.

import type { ComponentRef, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Glass } from '@/components/Glass/Glass';
import { type Anchor } from '@/components/PullDownMenu/PullDownMenu';
import { DOCK_SPRING } from '@/components/TabBar/TabBar';
import CaretDown from '@/icons/caret-down.svg';
import { colors } from '@/styles/theme';
import styles, { RADIUS } from './styles';

export { SEARCH_HEIGHT } from './styles';

/** The search field and the docked chip share this height. */
/** Between the docked chip and the search field. */
const GAP = 8;

/**
 * How far the filter has docked, 0 (in the list) to 1 (in the search row). One value drives both the chip
 * here and the pill in the list, so one fades out as the other fades in instead of both showing at once.
 */
export function useDockProgress(docked: boolean) {
  const reduceMotion = useReducedMotion();
  const d = useSharedValue(docked ? 1 : 0);
  useEffect(() => {
    const to = docked ? 1 : 0;
    d.set(reduceMotion ? to : withSpring(to, DOCK_SPRING));
  }, [docked, reduceMotion, d]);
  return d;
}

type Props = {
  /** Shown docked: the list's filter has scrolled under the search field. */
  docked: boolean;
  /** From useDockProgress(docked). */
  progress: SharedValue<number>;
  /** The picked filter, e.g. "Resurvey due". */
  label: string;
  /** Opens the filter's pull-down under the chip. */
  onOpen: (anchor: Anchor) => void;
  accessibilityLabel: string;
  style?: ViewStyle;
  /** The search field. */
  children: ReactNode;
};

export function SearchRow({
  docked,
  progress,
  label,
  onOpen,
  accessibilityLabel,
  style,
  children,
}: Props) {
  const chipRef = useRef<ComponentRef<typeof View>>(null);
  const [chip, setChip] = useState(0);

  // The search field is the row's flexible part, so it narrows and widens as the chip grows and shrinks.
  // The spring can overshoot: past 1 the chip just bulges a touch, but below 0 it would get a negative
  // width and push the field past its edge, so it stops at 0
  const grow = useAnimatedStyle(() => {
    const d = Math.max(0, progress.get());
    return {
      width: d * chip,
      marginRight: d * GAP,
      transform: [{ scale: interpolate(d, [0, 1], [0.5, 1]) }],
    };
  });
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.5, 1], [0, 1], 'clamp'),
  }));

  const open = () =>
    chipRef.current?.measureInWindow((x, y, width, height) =>
      onOpen({ x, y, width, height }),
    );
  const chipContent = (
    <>
      <Text style={styles.chipText}>{label}</Text>
      <CaretDown
        width={14}
        height={14}
        color={colors.tertiary}
        strokeWidth={1.8}
      />
    </>
  );

  return (
    <View style={[styles.row, style]}>
      {/* Measures the chip at its natural width, which the clipped glass can't do while it's narrow */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.measure}
      >
        <View
          onLayout={e => setChip(e.nativeEvent.layout.width)}
          style={styles.chip}
        >
          {chipContent}
        </View>
      </View>

      {/* Plain glass whatever it shows, like the sort: the word says it */}
      <Glass radius={RADIUS} interactive style={[styles.docked, grow]}>
        <Animated.View ref={chipRef} style={[styles.clip, content]}>
          <Pressable
            onPress={open}
            disabled={!docked}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel}: ${label}`}
            accessibilityElementsHidden={!docked}
            importantForAccessibility={docked ? 'auto' : 'no-hide-descendants'}
            style={({ pressed }) => [
              styles.chip,
              pressed && styles.chipPressed,
            ]}
          >
            {chipContent}
          </Pressable>
        </Animated.View>
      </Glass>

      <View style={styles.search}>{children}</View>
    </View>
  );
}
