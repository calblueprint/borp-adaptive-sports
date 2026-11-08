import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import styles from './styles';

type ButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// The app's default button: a rounded black pill
function Button({ text, onPress, disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{text}</Text>
    </Pressable>
  );
}

export default Button;
