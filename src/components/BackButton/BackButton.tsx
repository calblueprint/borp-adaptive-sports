import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import CaretLeft from '@/icons/caret-left.svg';
import colors from '@/styles/colors';
import styles from './styles';

type BackButtonProps = {
  // Defaults to going back one screen in the router.
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function BackButton({ onPress, style }: BackButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <CaretLeft width={24} height={24} color={colors.black} />
    </Pressable>
  );
}

export default BackButton;
