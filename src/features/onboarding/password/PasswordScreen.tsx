// Figma: Creating an Account 06 (empty) / 05 (hidden) / 04 (shown).
// With mode=reset (from "Forgot password?") it sets a new password and signs the user in.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { AuthScreen, Heading } from '@/components/AuthScreen/AuthScreen';
import { Field } from '@/components/Field/Field';
import { findAccount } from '@/data/accounts';
import { finishAuth } from '@/features/onboarding/finishAuth';
import { useSignUp } from '@/features/onboarding/SignUpProvider';
import CheckCircle from '@/icons/check-circle.svg';
import HidePassword from '@/icons/hide-password.svg';
import ShowPassword from '@/icons/show-password.svg';
import XSmall from '@/icons/x-small.svg';
import { colors, type } from '@/styles/theme';
import styles from './styles';

export default function PasswordScreen() {
  const signUp = useSignUp();
  const reset = useLocalSearchParams<{ mode?: 'reset' }>().mode === 'reset';
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const rules = [
    { label: 'At least 10 character', met: password.length >= 10 },
    {
      label: 'Contains a special character',
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ];
  const valid = rules.every(r => r.met);
  const submit = () => {
    if (!valid) return;
    if (!reset) return router.push('/prototype/profile');
    const name = findAccount(signUp.email)?.name.split(' ')[0];
    finishAuth(
      name ? `Password updated. Welcome back, ${name}!` : 'Password updated',
      signUp.reset,
    );
  };

  return (
    <AuthScreen nav="back" keyboard>
      {reset ? (
        <Heading
          title="Create a new password"
          subtitle="You’ll use it the next time you sign in"
        />
      ) : (
        <Heading
          title="Your email is verified"
          subtitle="Please enter your password"
        />
      )}
      <View style={styles.fields}>
        <Field label="Email" readOnly value={signUp.email} />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          autoFocus
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          right={
            password ? (
              <Pressable
                onPress={() => setVisible(v => !v)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={visible ? 'Hide password' : 'Show password'}
              >
                {visible ? (
                  <HidePassword color={colors.eye} />
                ) : (
                  <ShowPassword color={colors.eye} />
                )}
              </Pressable>
            ) : null
          }
        />
        <View style={styles.rules} accessibilityLiveRegion="polite">
          {rules.map(r => (
            <View key={r.label} style={styles.rule}>
              {r.met ? (
                <CheckCircle color={colors.ok} />
              ) : (
                <XSmall color={colors.muted} />
              )}
              <Text style={[type.description, r.met && styles.ruleMet]}>
                {r.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.spacer} />
      <ActionButton label="Continue" disabled={!valid} onPress={submit} />
    </AuthScreen>
  );
}
