import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import ActionButton from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import supabase from '~/api/supabase/client';
import { normalizeEmail } from '~/api/supabase/queries/auth';
import { errorMessage } from './errorMessage';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logIn() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const address = normalizeEmail(email);
      if (!password) throw new Error('Enter your password.');
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: address,
        password,
      });
      if (authError?.code === 'email_not_confirmed')
        throw new Error(
          'Your email is not verified. Complete account creation before logging in.',
        );
      if (authError?.code === 'invalid_credentials')
        throw new Error('Incorrect email or password. Please try again.');
      if (authError) throw authError;
    } catch (cause) {
      setError(errorMessage(cause, 'Unable to log in. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <Text>Log in</Text>
      <Text>Email</Text>
      <TextInput
        accessibilityLabel="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        editable={!busy}
      />
      <Text>Password</Text>
      <TextInput
        accessibilityLabel="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        editable={!busy}
        onSubmitEditing={() => void logIn()}
        returnKeyType="done"
      />
      <Button
        title={showPassword ? 'Hide password' : 'Show password'}
        onPress={() => setShowPassword(value => !value)}
      />
      <Button
        title="Forgot password"
        disabled={busy}
        onPress={() => router.push('/forgot-password')}
      />
      <ActionButton
        text={busy ? 'Please wait…' : 'Log in'}
        disabled={busy}
        onPress={() => void logIn()}
      />
      {error && <Text accessibilityRole="alert">{error}</Text>}
      <ActionButton
        text="Create account"
        disabled={busy}
        onPress={() => router.push('/signup')}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
