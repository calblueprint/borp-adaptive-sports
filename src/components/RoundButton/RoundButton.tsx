import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import { Glass } from '@/components/Glass/Glass';
import styles from './styles';

type RoundButtonProps = {
  onPress: () => void;
  label: string;
  children: ReactNode;
  style?: ViewStyle;
};

/** Round floating button: glass, 44pt. */
export function RoundButton({
  onPress,
  label,
  children,
  style,
}: RoundButtonProps) {
  return (
    <Glass radius={22} interactive style={[styles.round, style]}>
      <Pressable
        onPress={onPress}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    </Glass>
  );
}
