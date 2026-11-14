import type { ComponentRef, ReactNode, RefObject } from 'react';
import { useEffect } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass/Glass';
import { photoSource, useAccount } from '@/features/account/AccountProvider';
import HouseFill from '@/icons/house-fill.svg';
import House from '@/icons/house.svg';
import { colors } from '@/styles/theme';
import styles, { TAB_BAR_HEIGHT, TAB_W } from './styles';

export { DOCK_INSET, TAB_BAR_HEIGHT } from './styles';

/** Space to leave under scrolling content so the last item clears the floating tab bar. */
export const tabBarClearance = (bottomInset: number) =>
  TAB_BAR_HEIGHT + Math.max(bottomInset - 1, 16) + 16;

/** Shared by the floating controls that grow or shrink (tab bar, filter capsule), so they move alike. */
export const DOCK_SPRING = { damping: 24, stiffness: 260, mass: 0.9 } as const;
const SELECT_SPRING = { damping: 22, stiffness: 280, mass: 0.8 } as const;

type Tab = 'home' | 'profile';

type TabBarProps = {
  current: Tab;
  onSelect: (tab: Tab) => void;
  /** A glass control on the right, e.g. the list's navy +. */
  accessory?: ReactNode;
  /** Android: the BlurTargetView wrapping the screen content, so the glass frosts it instead of showing a flat tint. */
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
};

/**
 * Floating tab bar (Figma: Home Nav Bar): Home and Profile in one glass pill with a selection that slides to
 * the tab you tap (its icon fills). It sits at the left, the same on every tab, so switching doesn't move it;
 * the right is left for the screen's own controls. Always open: a dock that shrinks away hides where things
 * are. Shared by the tabs layout, so the screen swaps at once while the selection slides.
 */
export function TabBar({
  current,
  onSelect,
  accessory,
  blurTarget,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(current === 'home' ? 0 : TAB_W);
  const bottom = Math.max(insets.bottom - 1, 16);

  useEffect(() => {
    const to = current === 'home' ? 0 : TAB_W;
    x.set(reduceMotion ? to : withSpring(to, SELECT_SPRING));
  }, [current, reduceMotion, x]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  const go = (tab: Tab) => {
    if (tab === current) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onSelect(tab);
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Glass
        radius={TAB_BAR_HEIGHT / 2}
        interactive
        blurTarget={blurTarget}
        style={styles.tabs}
      >
        <View style={styles.row}>
          <Animated.View style={[styles.pill, pill]} />
          <Pressable
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel="Home"
            accessibilityState={{ selected: current === 'home' }}
            onPress={() => go('home')}
          >
            {current === 'home' ? (
              <HouseFill color={colors.stone} />
            ) : (
              <House color={colors.stone} />
            )}
          </Pressable>
          <Pressable
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel="Profile"
            accessibilityState={{ selected: current === 'profile' }}
            onPress={() => go('profile')}
          >
            <Avatar on={current === 'profile'} />
          </Pressable>
        </View>
      </Glass>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </View>
  );
}

/** Your photo, or a placeholder person until you add one in Edit profile. Fills in when its tab is selected. */
function Avatar({ on }: { on: boolean }) {
  const { photo } = useAccount().user;
  if (photo)
    return (
      <Image
        source={photoSource(photo)}
        style={[styles.avatar, on && styles.avatarOn]}
        accessibilityIgnoresInvertColors
      />
    );
  return (
    <View style={[styles.avatar, on && styles.avatarFilled]}>
      <Svg width={16} height={16} viewBox="0 0 16 16">
        <Circle cx={8} cy={5.5} r={3} fill={colors.white} />
        <Path
          d="M2.5 15c.6-3 2.8-4.75 5.5-4.75S12.9 12 13.5 15Z"
          fill={colors.white}
        />
      </Svg>
    </View>
  );
}
