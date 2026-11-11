import type { SharedValue } from 'react-native-reanimated';
import { Text } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Frost } from '@/components/Glass/Glass';
import { layout, type } from '@/styles/theme';
import styles from './styles';

/** Top of a 44pt round button in the bar, centred in it below the status bar. */
export const barButtonTop = (insetTop: number) =>
  insetTop + (layout.barHeight - 44) / 2;

type TitleBarProps = {
  title: string;
  /** The page's scroll offset. */
  y: SharedValue<number>;
  /** Scroll offsets where the bar starts sliding in and where it's all the way down. */
  from: number;
  to: number;
  /** A hairline under the bar, for pages whose content runs right up under it. */
  hairline?: boolean;
};

/** The page's title in a frosted bar, sliding down once the big title scrolls under the status bar. Slides,
 *  never fades: a fading blur renders badly on iOS. */
export function TitleBar({ title, y, from, to, hairline }: TitleBarProps) {
  const { top } = useSafeAreaInsets();
  const height = top + layout.barHeight;
  const slide = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          y.get(),
          [from, to],
          [-height, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  return (
    <Animated.View style={[styles.bar, { height }, slide]} pointerEvents="none">
      <Frost
        style={[styles.frost, hairline && styles.hairline, { paddingTop: top }]}
      >
        <Text style={type.barTitle} numberOfLines={1}>
          {title}
        </Text>
      </Frost>
    </Animated.View>
  );
}
