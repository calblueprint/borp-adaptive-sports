import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, Text } from 'react-native';
import styles from './styles';

type PillButtonProps = {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/** Secondary action beside content (Download, Resume): grey fill and a black label, like the chips. */
export function PillButton({
  label,
  icon,
  onPress,
  accessibilityLabel,
  style,
}: PillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed, style]}
    >
      {icon}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
