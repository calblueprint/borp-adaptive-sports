import type { ReactNode } from 'react';
import type { PressableProps, ViewStyle } from 'react-native';
import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RollingLoader } from '@/components/BorpLogo/RollingLoader';
import { colors, type } from '@/styles/theme';
import styles from './styles';

type ActionButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'soft';
  /** regular: the auth screens' 47pt (Figma). large: 56pt, for the main action at the bottom of a screen
   *  (Start survey, Save, Send) and capture actions: easy to hit with gloves on. */
  size?: 'regular' | 'large';
  /** Shows the spinning-wheel loader and greys the button out. */
  loading?: boolean;
  icon?: ReactNode;
  /** 0–1 while disabled: the button fills up as the steps it waits on get done, then turns black. */
  progress?: number;
  style?: ViewStyle;
};

/** The prototype's main button: a black pill, with a loader, a soft variant and a fill-up progress state. */
export function ActionButton({
  label,
  variant = 'primary',
  size = 'regular',
  loading,
  disabled,
  icon,
  progress,
  style,
  ...rest
}: ActionButtonProps) {
  const off = disabled || loading;
  const filling = off && !loading && progress !== undefined;
  const textColor = filling
    ? colors.secondary
    : variant === 'soft' && !off
      ? colors.ink
      : colors.white;
  return (
    <Pressable
      {...rest}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'large' && styles.large,
        variant === 'soft' && styles.soft,
        off && styles.disabled,
        filling && styles.filling,
        pressed && !off && styles.pressed,
        style,
      ]}
    >
      {filling ? <ProgressFill progress={progress} /> : null}
      {loading ? <RollingLoader size={28} /> : icon}
      <Text style={[type.button, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

function ProgressFill({ progress }: { progress: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(progress);
  useEffect(() => {
    p.set(
      reduce
        ? progress
        : withTiming(progress, {
            duration: 280,
            easing: Easing.out(Easing.quad),
          }),
    );
  }, [progress, reduce, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.get() * 100}%` }));
  return <Animated.View style={[styles.progressFill, fill]} />;
}
