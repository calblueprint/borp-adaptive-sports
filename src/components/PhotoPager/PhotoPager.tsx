// Swipe through a trail's photos, with Airbnb's dots for where you are. Used by the list cards and the top
// of the trail page.
// Arrows are for anyone who can't swipe reliably. They stay out of the way until you reach for the photos:
// they fade in on any touch, swipe or pointer hover (and once as the trail page opens), then fade out after
// a few idle seconds so the photo stays clean. Small and see-through dark like the card's heart, so they
// never compete with the page's Back and save buttons. VoiceOver moves through the photos its own way.

import type { PhotoCredit } from '@/data/trail-photos';
import type { ComponentRef } from 'react';
import type {
  ImageSourcePropType,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PointerEvent,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import CaretLeft from '@/icons/caret-left.svg';
import { colors } from '@/styles/theme';
import styles from './styles';

const IDLE_MS = 3000;

type Photo = { image: ImageSourcePropType; credit: PhotoCredit };

/** Which photo is showing and whether the arrows are out. Held by whoever owns the accessibility for it (a card offers next/previous as actions). */
export function usePhotoPager(count: number, { flash = false } = {}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [index, setIndex] = useState(0);
  // `flash`: out once when the photos first show, as a hint there are more
  const [arrows, setArrows] = useState(flash && count > 1);
  // Bumped by `go`, so the pager scrolls itself to `index` (a swipe sets `index` without one)
  const [jump, setJump] = useState(0);

  useEffect(() => {
    const t = timer;
    if (flash) t.current = setTimeout(() => setArrows(false), IDLE_MS);
    return () => clearTimeout(t.current);
  }, [flash]);

  /** Out until `idle` is called (while dragging or hovering). */
  const hold = () => {
    clearTimeout(timer.current);
    if (count > 1) setArrows(true);
  };
  const idle = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setArrows(false), IDLE_MS);
  };
  const reveal = () => {
    hold();
    idle();
  };
  const go = (i: number) => {
    setIndex(Math.max(0, Math.min(count - 1, i)));
    setJump(j => j + 1);
  };

  return { index, setIndex, jump, arrows, hold, idle, reveal, go };
}

export type PhotoPagerState = ReturnType<typeof usePhotoPager>;

type Props = {
  photos: Photo[];
  pager: PhotoPagerState;
  /** How much of the bottom something else covers (the trail page's sheet), so dots and arrows sit in what shows. */
  covered?: number;
  /** How much of the top sits under the status bar (the trail page's photo runs up behind it), so the arrows centre below it. */
  coveredTop?: number;
  /** False while something else fills the frame (a card's route map): no swiping, dots or arrows. */
  enabled?: boolean;
  /** What a tap on a photo does (the trail page opens it full screen; a card opens the trail). */
  onPressPhoto: (i: number) => void;
  /** False inside a card, where the card itself is the VoiceOver element. */
  photosAccessible?: boolean;
  photoLabel?: (i: number) => string;
  accessibilityLabel?: string;
};

/** Fills its parent. */
export function PhotoPager({
  photos,
  pager,
  covered = 0,
  coveredTop = 0,
  enabled = true,
  onPressPhoto,
  photosAccessible = true,
  photoLabel,
  accessibilityLabel,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const many = photos.length > 1;
  const { index, jump } = pager;
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const jumped = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (jump === jumped.current) return;
    jumped.current = jump;
    scroll.current?.scrollTo({
      x: index * size.width,
      animated: !reduceMotion,
    });
  }, [jump, index, size.width, reduceMotion]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.width)
      pager.setIndex(Math.round(e.nativeEvent.contentOffset.x / size.width));
  };
  // A mouse or trackpad; fingers are covered by onTouchStart
  const onPointerEnter = (e: PointerEvent) =>
    e.nativeEvent.pointerType === 'mouse' && pager.hold();
  const onPointerLeave = (e: PointerEvent) =>
    e.nativeEvent.pointerType === 'mouse' && pager.idle();
  const step = (by: number) => {
    pager.go(index + by);
    pager.reveal();
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const photoStyle = { width: size.width, height: size.height };

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      onTouchStart={enabled ? pager.reveal : undefined}
      onPointerEnter={enabled ? onPointerEnter : undefined}
      onPointerLeave={enabled ? onPointerLeave : undefined}
    >
      {size.width ? (
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          scrollEnabled={enabled && many}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onScrollBeginDrag={pager.hold}
          onScrollEndDrag={pager.idle}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={64}
          accessibilityLabel={accessibilityLabel}
        >
          {/* Each photo is its own button: plain images inside a tappable card won't scroll on iOS */}
          {photos.map((p, i) => (
            <Pressable
              key={i}
              onPress={() => onPressPhoto(i)}
              accessible={photosAccessible}
              accessibilityRole="imagebutton"
              accessibilityLabel={photoLabel?.(i)}
              accessibilityHint="Opens full screen"
            >
              <Image
                source={p.image}
                style={photoStyle}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        // Before the frame is measured: the first photo, so nothing flashes empty
        <Image
          source={photos[0].image}
          style={styles.fill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}

      {many && enabled ? (
        <View
          style={[styles.dots, { bottom: covered + 12 }]}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}

      {many && enabled && pager.arrows && size.width ? (
        // Centred in the part of the photo that shows
        <View
          style={[styles.arrows, { top: coveredTop, bottom: covered }]}
          pointerEvents="box-none"
        >
          {index > 0 ? (
            <Arrow side="left" onPress={() => step(-1)} />
          ) : (
            <View />
          )}
          {index < photos.length - 1 ? (
            <Arrow side="right" onPress={() => step(1)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Arrow({
  side,
  onPress,
}: {
  side: 'left' | 'right';
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(240)}
      style={styles.arrow}
    >
      <Pressable
        onPress={onPress}
        hitSlop={8} // 28 + 2×8 = a 44pt target
        accessibilityRole="button"
        accessibilityLabel={side === 'left' ? 'Previous photo' : 'Next photo'}
        style={({ pressed }) => [
          styles.arrowHit,
          pressed && styles.arrowPressed,
        ]}
      >
        <View style={side === 'right' && styles.flip}>
          <CaretLeft width={14} height={14} color={colors.white} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
