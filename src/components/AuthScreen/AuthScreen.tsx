// Screen shell for sign-up and sign-in: white, status bar, Borp header.
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BorpLogo } from '@/components/BorpLogo/BorpLogo';
import CaretLeft from '@/icons/caret-left.svg';
import Close from '@/icons/close.svg';
import { colors, type } from '@/styles/theme';
import styles from './styles';

/** Air under the bottom button: above the home indicator at rest, above the keyboard while typing. */
export const BUTTON_GAP = 16;

type ScreenProps = {
  /** "back" puts a caret on the left, "close" puts an × on the right (Figma 10/09). */
  nav?: 'back' | 'close';
  /** Wraps content so the bottom button rides above the keyboard. */
  keyboard?: boolean;
  children: ReactNode;
};

export function AuthScreen({
  nav = 'back',
  keyboard = false,
  children,
}: ScreenProps) {
  const { bottom } = useSafeAreaInsets();
  // The bottom button clears the home indicator, the same height as on the welcome screen
  const body = (
    <View style={[styles.body, { paddingBottom: bottom + BUTTON_GAP }]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BorpLogo variant="wordmark" width={86.47} />
        <NavButton kind={nav} onPress={() => router.back()} />
      </View>
      {keyboard ? (
        // With the keyboard up the home-indicator room goes under the keys, so the button sits BUTTON_GAP above them
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={-bottom}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

function NavButton({
  kind,
  onPress,
}: {
  kind: 'back' | 'close';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={kind === 'back' ? 'Back' : 'Close'}
      style={({ pressed }) => [
        styles.navButton,
        kind === 'close' ? styles.navRight : styles.navLeft,
        pressed && styles.pressed,
      ]}
    >
      {kind === 'back' ? (
        <CaretLeft color={colors.stone} />
      ) : (
        <Close color={colors.stone} />
      )}
    </Pressable>
  );
}

export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.heading}>
      <Text style={[type.sectionTitle, styles.ink]} accessibilityRole="header">
        {title}
      </Text>
      <Text style={type.subheader}>{subtitle}</Text>
    </View>
  );
}
