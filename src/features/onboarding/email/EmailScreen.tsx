// Figma: Creating an Account 10 (empty) / 09 (filled).
// Existing accounts go to sign in (password only); new emails get an 8-digit code to start sign up.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { AuthScreen, Heading } from '@/components/AuthScreen/AuthScreen';
import { Field } from '@/components/Field/Field';
import { findAccount } from '@/data/accounts';
import { useSignUp } from '@/features/onboarding/SignUpProvider';
import styles from './styles';

const isEmail = (v: string) => /^\S+@\S+\.\S{2,}$/.test(v.trim());

export default function EmailScreen() {
  const signUp = useSignUp();
  const [email, setEmail] = useState(signUp.email);
  const valid = isEmail(email);

  const submit = () => {
    if (!valid) return;
    signUp.setEmail(email.trim());
    router.push(
      findAccount(email) ? '/prototype/sign-in' : '/prototype/verify',
    );
  };

  return (
    <AuthScreen nav="close" keyboard>
      <Heading
        title="Continue with Email"
        subtitle="Sign in or sign up with your email"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <View style={styles.spacer} />
      <ActionButton label="Continue" disabled={!valid} onPress={submit} />
    </AuthScreen>
  );
}
