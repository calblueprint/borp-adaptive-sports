// Figma: Creating an Account 11 — welcome. Opens with the rolling-logo intro.
import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { BUTTON_GAP } from '@/components/AuthScreen/AuthScreen';
import { RollingLogo } from '@/components/BorpLogo/RollingLogo';
import GoogleG from '@/icons/google-g.svg';
import { spring } from '@/styles/theme';
import styles from './styles';

const FRAME_HEIGHT = 874; // Figma frame
const LOGO_SIZE = 171;
const LOGO_TOP = 304;

export default function WelcomeScreen() {
  const { height } = useWindowDimensions();
  const [introDone, setIntroDone] = useState(false);
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {__DEV__ && (
        // DEV ONLY: jump past the auth screens straight to home
        <Pressable
          onPress={() => router.replace('/prototype/trails')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip auth (dev only)"
          style={({ pressed }) => [
            styles.devSkip,
            { top: insets.top + 8 },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.devSkipText}>Skip (dev)</Text>
        </Pressable>
      )}
      <View style={[styles.logo, { top: (LOGO_TOP / FRAME_HEIGHT) * height }]}>
        <RollingLogo
          size={LOGO_SIZE}
          paused={!focused}
          onDone={() => setIntroDone(true)}
        />
      </View>

      {introDone && (
        <Animated.View
          entering={FadeInDown.springify(spring.pop.duration).dampingRatio(
            spring.pop.dampingRatio,
          )}
          style={[styles.actions, { bottom: insets.bottom + BUTTON_GAP }]}
        >
          <View style={styles.stack}>
            <ActionButton
              label="Continue with Google"
              icon={<GoogleG />}
              onPress={() => router.push('/prototype/profile')}
            />
            <ActionButton
              label="Continue with Email"
              variant="soft"
              onPress={() => router.push('/prototype/email')}
            />
          </View>
          <Text style={styles.legal}>
            By continuing, you agree to Borp’s <Link label="Usage Policy" /> and
            acknowledge their <Link label="Privacy Policy" />.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

function Link({ label }: { label: string }) {
  return (
    <Text style={styles.link} accessibilityRole="link" onPress={() => {}}>
      {label}
    </Text>
  );
}
