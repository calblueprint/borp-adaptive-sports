// Save a trail with a heart, like Airbnb or AllTrails: on every card's photo and on the trail page.
// Saved trails are listed in the profile. A red fill (not colour alone: the outline fills in) says it's saved;
// it pops once when you save, up and back with no wobble.
import type { ViewStyle } from 'react-native';
import { type ComponentRef, type RefObject } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Glass } from '@/components/Glass/Glass';
import { Heart } from '@/components/Icon/Icon';
import { useAccount } from '@/features/account/AccountProvider';
import { colors, overlay } from '@/styles/theme';
import styles from './styles';

/** Saved state for one trail, with the pop and haptic. Shared so a card can offer it as a VoiceOver action too. */
export function useSave(trailId: string, name: string) {
  const { saved, toggleSaved } = useAccount();
  const on = saved.includes(trailId);
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.get() }],
  }));
  const toggle = () => {
    if (!on && !reduceMotion)
      pop.set(
        withSequence(
          withTiming(1.25, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 180, easing: Easing.inOut(Easing.quad) }),
        ),
      );
    if (Platform.OS !== 'web')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaved(trailId);
  };
  const label = on ? `Remove ${name} from saved` : `Save ${name}`;
  return { on, toggle, popStyle, label };
}

export type Save = ReturnType<typeof useSave>;

/**
 * The heart in a card photo's top-right corner, bare like Airbnb's: a white outline around a see-through
 * dark fill so it reads on any photo, red once saved. Inside a card it's hidden from VoiceOver (the card
 * offers "Save" as an action).
 */
export function PhotoHeart({
  save,
  accessible = true,
  style,
}: {
  save: Save;
  accessible?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={save.toggle}
      hitSlop={5} // 40 + 2×5 = a 50pt target
      accessible={accessible}
      accessibilityRole="button"
      accessibilityLabel={save.label}
      accessibilityState={{ selected: save.on }}
      // Shrinks rather than fades: a fading blur renders badly on iOS
      style={({ pressed }) => [
        styles.photoHit,
        style,
        pressed && styles.photoPressed,
      ]}
    >
      <Animated.View style={[styles.photoHeart, save.popStyle]}>
        <Heart
          size={26}
          color={colors.white}
          strokeWidth={2}
          fill={save.on ? colors.heart : overlay.scrim}
        />
      </Animated.View>
    </Pressable>
  );
}

/** The heart on the trail page: a 44pt glass button across from Back, ink outline, red once saved. */
export function GlassHeart({
  save,
  style,
  blurTarget,
}: {
  save: Save;
  style?: ViewStyle;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
}) {
  return (
    <Glass radius={22} interactive blurTarget={blurTarget} style={style}>
      <Pressable
        onPress={save.toggle}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={save.label}
        accessibilityHint={
          save.on ? undefined : 'Saved trails are listed in your profile'
        }
        accessibilityState={{ selected: save.on }}
        style={({ pressed }) => [styles.glassHit, pressed && styles.pressed]}
      >
        <Animated.View style={save.popStyle}>
          <Heart
            filled={save.on}
            size={22}
            color={save.on ? colors.heart : colors.ink}
          />
        </Animated.View>
      </Pressable>
    </Glass>
  );
}
