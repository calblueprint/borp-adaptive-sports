// iOS-style segmented control: every option is visible at once (no sideways scrolling) and the
// white thumb slides to the one you pick. Segments size to their label, then share the spare width.
import type { LayoutRectangle } from 'react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styles from './styles';

type Props<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const [layouts, setLayouts] = useState<Partial<Record<T, LayoutRectangle>>>(
    {},
  );
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const shown = useSharedValue(0);
  const current = layouts[value];

  useEffect(() => {
    if (!current) return;
    // Jump into place the first time, slide after that
    if (!shown.get()) {
      x.set(current.x);
      width.set(current.width);
      shown.set(1);
    } else {
      x.set(withTiming(current.x, { duration: 220 }));
      width.set(withTiming(current.width, { duration: 220 }));
    }
  }, [current, x, width, shown]);

  const thumbStyle = useAnimatedStyle(() => ({
    opacity: shown.get(),
    width: width.get(),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View
      style={styles.track}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.thumb, thumbStyle]} />
      {options.map(o => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            onLayout={e => {
              const layout = e.nativeEvent.layout;
              setLayouts(l => ({ ...l, [o.key]: layout }));
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={styles.segment}
          >
            <Text
              style={[styles.label, on && styles.labelOn]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
