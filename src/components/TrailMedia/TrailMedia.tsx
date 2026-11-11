// A trail's photos with its Apple Maps route in a small square in the corner. Swipe the photos (dots say
// where you are); tapping the square swaps the one showing with the route, so the route can fill the frame.
// Used by the list cards.
// A short white pill in the photo's top-left corner, like Airbnb's badges ("Resurvey due"). The save heart sits top-right (the card adds it). Offline downloads aren't shown here: they only matter once you start a survey (Get ready).
import type { PhotoPagerState } from '@/components/PhotoPager/PhotoPager';
import type { Trail } from '@/data/trails';
import type { StyleProp, ViewStyle } from 'react-native';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PhotoPager } from '@/components/PhotoPager/PhotoPager';
import { TrailSnapshot } from '@/components/TrailImage/TrailImage';
import { trailPhotos } from '@/data/trail-photos';
import styles from './styles';

const SWAP_MS = 320;

/** Swap state, held by whoever owns the accessibility for it (a card offers it as an action). */
export function useMediaSwap() {
  const [showMap, setShowMap] = useState(false);
  const reduceMotion = useReducedMotion();
  // 0 = photo large, map in the corner; 1 = swapped
  const swapped = useSharedValue(0);
  const toggle = () => {
    const next = !showMap;
    setShowMap(next);
    swapped.set(
      reduceMotion
        ? Number(next)
        : withTiming(Number(next), {
            duration: SWAP_MS,
            easing: Easing.out(Easing.cubic),
          }),
    );
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };
  return {
    showMap,
    toggle,
    swapped,
    label: showMap ? 'Show photo' : 'Show route map',
  };
}

export type MediaSwap = ReturnType<typeof useMediaSwap>;

type Props = {
  trail: Trail;
  swap: MediaSwap;
  pager: PhotoPagerState;
  /** A tap on the photo (a card opens the trail). */
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Side of the corner square. */
  inset?: number;
  /** Space from the frame's edges to the corner square and the labels. */
  edge?: number;
  /** False inside a card, where VoiceOver gets the swap as a card action instead. */
  insetAccessible?: boolean;
  /** A short white pill in the top-left corner, e.g. "Resurvey due". */
  tag?: string;
};

export function TrailMedia({
  trail,
  swap,
  pager,
  onPress,
  style,
  inset = 64,
  edge = 16,
  insetAccessible = true,
  tag,
}: Props) {
  const photos = trailPhotos(trail.id);
  const photo = photos[pager.index] ?? photos[0];
  const { swapped } = swap;

  // The large frame cross-fades; the corner square cross-fades the other way and dips in scale
  // halfway through, so it reads as the two trading places
  const largePhoto = useAnimatedStyle(() => ({ opacity: 1 - swapped.get() }));
  const largeMap = useAnimatedStyle(() => ({ opacity: swapped.get() }));
  const smallPhoto = useAnimatedStyle(() => ({ opacity: swapped.get() }));
  const smallMap = useAnimatedStyle(() => ({ opacity: 1 - swapped.get() }));
  const insetMotion = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.08 * Math.sin(swapped.get() * Math.PI) }],
  }));

  return (
    <View style={[styles.frame, style]}>
      {photo ? (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, largeMap]}>
            <TrailSnapshot trail={trail} variant="card" />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, largePhoto]}
            pointerEvents={swap.showMap ? 'none' : 'auto'}
          >
            <PhotoPager
              photos={photos}
              pager={pager}
              enabled={!swap.showMap}
              onPressPhoto={onPress}
              photosAccessible={insetAccessible}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.inset,
              {
                width: inset,
                height: inset,
                right: edge,
                bottom: edge,
                borderRadius: inset * 0.19,
              },
              insetMotion,
            ]}
          >
            <Pressable
              onPress={swap.toggle}
              accessible={insetAccessible}
              accessibilityRole="button"
              accessibilityLabel={swap.label}
              style={({ pressed }) => [
                styles.insetClip,
                { borderRadius: inset * 0.19 - 2 },
                pressed && styles.insetPressed,
              ]}
            >
              <Animated.View style={[StyleSheet.absoluteFill, smallMap]}>
                <TrailSnapshot trail={trail} variant="thumb" />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, smallPhoto]}>
                <Image
                  source={photo.image}
                  style={styles.fill}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </>
      ) : (
        // Trails added in the app have no photo yet: the route map fills the frame instead
        <TrailSnapshot trail={trail} variant="card" />
      )}
      {tag ? (
        // The card's own label says it for VoiceOver
        <View
          pointerEvents="none"
          style={[styles.label, { top: edge, left: edge }]}
        >
          <Text style={styles.labelText}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
}
