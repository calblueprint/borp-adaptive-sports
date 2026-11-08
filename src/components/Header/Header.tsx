import { Pressable, View } from 'react-native';
import CaretLeft from '@/icons/caret-left.svg';
import Close from '@/icons/close.svg';
import colors from '@/styles/colors';
import BorpWordmark from '~/assets/borp-wordmark.svg';
import styles from './styles';

type HeaderProps = {
  // Shows a back arrow on the left
  onBack?: () => void;
  // Shows a close (X) on the right
  onClose?: () => void;
};

// App header: BORP logo centered, with optional back / close buttons
function Header({ onBack, onClose }: HeaderProps) {
  return (
    <View style={styles.header}>
      <BorpWordmark width={86.5} height={21} accessibilityLabel="BORP" />
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={onBack}
          style={[styles.navButton, styles.left]}
        >
          <CaretLeft width={24} height={24} color={colors.black} />
        </Pressable>
      )}
      {onClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={onClose}
          style={[styles.navButton, styles.right]}
        >
          <Close width={24} height={24} color={colors.black} />
        </Pressable>
      )}
    </View>
  );
}

export default Header;
