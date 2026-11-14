// Sign in — returning user (not in Figma yet; built in the style of the sign-up screens).
// Reached from the email screen when the address already has an account.
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { AuthScreen, Heading } from '@/components/AuthScreen/AuthScreen';
import { Field } from '@/components/Field/Field';
import { TextLink } from '@/components/TextLink/TextLink';
import { findAccount } from '@/data/accounts';
import { useAccount } from '@/features/account/AccountProvider';
import { finishAuth } from '@/features/onboarding/finishAuth';
import { useSignUp } from '@/features/onboarding/SignUpProvider';
import HidePassword from '@/icons/hide-password.svg';
import ShowPassword from '@/icons/show-password.svg';
import { colors } from '@/styles/theme';
import styles from './styles';

const FAKE_CHECK_MS = 900;

export default function SignInScreen() {
  const signUp = useSignUp();
  const account = findAccount(signUp.email);
  const { signIn } = useAccount();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const submit = () => {
    if (!password || checking) return;
    setChecking(true);
    timer.current = setTimeout(() => {
      setChecking(false);
      if (account && password === account.password) {
        signIn({
          name: account.name,
          email: account.email,
          photo: account.photo,
          since: 'Apr 2025',
        });
        finishAuth(
          `Welcome back, ${account.name.split(' ')[0]}!`,
          signUp.reset,
        );
      } else {
        setError('That password isn’t right. Try again or reset it.');
      }
    }, FAKE_CHECK_MS);
  };

  return (
    <AuthScreen nav="back" keyboard>
      <Heading title="Welcome back" subtitle="Enter your password to sign in" />
      <View style={styles.fields}>
        <Field label="Email" readOnly value={signUp.email} />
        <Field
          label="Password"
          value={password}
          onChangeText={v => {
            setPassword(v);
            setError('');
          }}
          error={error}
          autoFocus
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="current-password"
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
        <View style={styles.forgot}>
          <TextLink
            label="Forgot password?"
            onPress={() =>
              router.push({
                pathname: '/prototype/verify',
                params: { mode: 'reset' },
              })
            }
          />
        </View>
      </View>
      <View style={styles.spacer} />
      <ActionButton
        label={checking ? 'Signing in...' : 'Sign in'}
        loading={checking}
        disabled={!password}
        onPress={submit}
      />
    </AuthScreen>
  );
}
