// Sign-up email check: an 8-digit code (not in Figma yet; replaces the magic link of Creating an Account 08/07).
// Only new accounts see it; returning users sign in with their password. Also used for
// "Forgot password?" (mode=reset), which then asks for a new password.
import type { TextInputRef } from '@/components/Field/Field';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { AuthScreen, Heading } from '@/components/AuthScreen/AuthScreen';
import { TextLink } from '@/components/TextLink/TextLink';
import { useSignUp } from '@/features/onboarding/SignUpProvider';
import styles from './styles';

const CODE_LENGTH = 8;
const RESEND_SECONDS = 30;
const FAKE_VERIFY_MS = 1200;

export default function VerifyScreen() {
  const { email } = useSignUp();
  const { mode } = useLocalSearchParams<{ mode?: 'reset' }>();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const input = useRef<TextInputRef>(null);
  const verifyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => () => clearTimeout(verifyTimer.current), []);

  // Prototype: any 8 digits pass. The code was used up, so back from the password screen skips this one
  const verify = (value = code) => {
    if (value.length < CODE_LENGTH || verifying) return;
    setVerifying(true);
    verifyTimer.current = setTimeout(() => {
      router.replace(
        mode === 'reset'
          ? { pathname: '/prototype/password', params: { mode } }
          : '/prototype/password',
      );
    }, FAKE_VERIFY_MS);
  };

  // Typing the last digit (or pasting / autofilling the code) verifies straight away
  const onChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(next);
    if (next.length === CODE_LENGTH) verify(next);
  };

  const resend = () => {
    setSecondsLeft(RESEND_SECONDS);
    setCode('');
    input.current?.focus();
  };

  const active =
    focused && !verifying ? Math.min(code.length, CODE_LENGTH - 1) : -1;
  const cell = (i: number) => (
    <View key={i} style={[styles.cell, i === active && styles.cellActive]}>
      <Text style={styles.digit}>{code[i] ?? ''}</Text>
    </View>
  );

  return (
    <AuthScreen nav="back" keyboard>
      <Heading
        title="Check your email"
        subtitle={`Enter the code sent to ${email}`}
      />
      <View>
        {/* Read as 4 + 4 like a phone number; one hidden field underneath takes typing, paste and autofill */}
        <View
          style={styles.cells}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <View style={styles.group}>{[0, 1, 2, 3].map(cell)}</View>
          <View style={styles.group}>{[4, 5, 6, 7].map(cell)}</View>
        </View>
        <TextInput
          ref={input}
          value={code}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!verifying}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          caretHidden
          accessibilityLabel="Verification code"
          accessibilityHint={`${CODE_LENGTH} digits, sent to ${email}`}
          style={styles.hiddenInput}
        />
      </View>
      {/* A returning user who mistyped their email lands here, not on sign in: one tap back to fix it */}
      <View style={styles.links}>
        <TextLink
          label={secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
          disabled={secondsLeft > 0}
          onPress={resend}
        />
        {mode === 'reset' ? null : (
          <TextLink label="Change email" onPress={() => router.back()} />
        )}
      </View>
      <View style={styles.spacer} />
      <ActionButton
        label={verifying ? 'Verifying...' : 'Continue'}
        loading={verifying}
        disabled={code.length < CODE_LENGTH}
        onPress={() => verify()}
      />
    </AuthScreen>
  );
}
