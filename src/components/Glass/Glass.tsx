import type { ComponentProps, ComponentRef, ReactNode, RefObject } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import styles from './styles';

// Glass surface for floating controls (tab bar, + button).
// iOS 26+: native Liquid Glass. Elsewhere: a frosted blur. With Reduce Transparency on: a solid fill.
// Glass takes Reanimated styles, so a surface can grow and shrink (the tab bar, the search field).

// isGlassEffectAPIAvailable guards against iOS 26 betas that lack the API and crash
const LIQUID_GLASS =
  Platform.OS === 'ios' &&
  isGlassEffectAPIAvailable() &&
  isLiquidGlassAvailable();

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    // Not implemented on web
    if (Platform.OS === 'web') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduce,
    );
    return () => sub.remove();
  }, []);
  return reduce;
}

type GlassProps = {
  radius: number;
  style?: ComponentProps<typeof Animated.View>['style'];
  /** A coloured glass for the one prominent control, e.g. the navy +. Solid colour where there's no Liquid Glass. */
  tint?: string;
  /** Liquid Glass only: the glass flexes and brightens under the finger. */
  interactive?: boolean;
  /** Android only: the BlurTargetView behind this surface. Without one, Android shows a translucent fill instead of blur. */
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  children?: ReactNode;
};

export function Glass({
  radius,
  style,
  tint,
  interactive,
  blurTarget,
  children,
}: GlassProps) {
  const reduce = useReduceTransparency();

  if (reduce || (tint && !LIQUID_GLASS)) {
    return (
      <Animated.View
        style={[
          styles.solid,
          { borderRadius: radius },
          tint ? { backgroundColor: tint } : null,
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  if (LIQUID_GLASS) {
    return (
      <AnimatedGlassView
        glassEffectStyle="regular"
        tintColor={tint}
        isInteractive={interactive}
        style={[{ borderRadius: radius }, style]}
      >
        {children}
      </AnimatedGlassView>
    );
  }

  return (
    <Animated.View style={[styles.frost, { borderRadius: radius }, style]}>
      {/* BlurView ignores borderRadius unless it also clips */}
      <BlurView
        intensity={40}
        tint="systemChromeMaterialLight"
        blurTarget={blurTarget}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={[styles.fill, styles.clip, { borderRadius: radius }]}
      />
      {children}
    </Animated.View>
  );
}

type FrostProps = Omit<ViewProps, 'style' | 'children'> & {
  /** light: bars over the white list. dark: small labels over photos. */
  tint?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  /** Android only: the BlurViewTarget behind this surface; without one Android gets a translucent fill. */
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  children?: ReactNode;
};

/** Frosted surface for bars and labels (not floating controls — those are <Glass>). Solid with Reduce Transparency. */
export function Frost({
  tint = 'light',
  style,
  blurTarget,
  children,
  ...rest
}: FrostProps) {
  const reduce = useReduceTransparency();
  const dark = tint === 'dark';
  const flat = reduce || (Platform.OS === 'android' && !blurTarget);
  const flatFill = dark
    ? reduce
      ? styles.frostDarkSolid
      : styles.frostDark
    : styles.frostLight;
  return (
    <View {...rest} style={[styles.clip, style]}>
      {flat ? (
        <View style={[StyleSheet.absoluteFill, flatFill]} />
      ) : (
        <>
          <BlurView
            intensity={dark ? 30 : 60}
            tint={dark ? 'dark' : 'systemChromeMaterialLight'}
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
          {dark ? (
            <View style={[StyleSheet.absoluteFill, styles.frostDarkTint]} />
          ) : null}
        </>
      )}
      {children}
    </View>
  );
}
