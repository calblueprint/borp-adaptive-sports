import { ReactNode } from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import styles from './styles';

type ButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  // 'primary' is black; 'secondary' is light with black text
  variant?: 'primary' | 'secondary';
  // Shown before the text, e.g. a logo
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// The app's default button: a rounded pill
function Button({
  text,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          variant === 'secondary' && styles.secondaryText,
          disabled && styles.disabledText,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

export default Button;
