import { Pressable, Text } from 'react-native';
import styles from './styles';

type TextLinkProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
};

// Underlined navy link, for secondary actions like "Forgot password?"
function TextLink({ text, onPress, disabled = false }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={[styles.text, disabled && styles.disabled]}>{text}</Text>
    </Pressable>
  );
}

export default TextLink;
