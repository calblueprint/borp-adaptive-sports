import { Pressable, Text } from 'react-native';
import styles from './styles';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** An underlined navy link, e.g. "Resend code". */
export function TextLink({ label, onPress, disabled }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="link"
      accessibilityState={{ disabled: !!disabled }}
    >
      {({ pressed }) => (
        <Text style={[styles.link, pressed && styles.pressed]}>{label}</Text>
      )}
    </Pressable>
  );
}
