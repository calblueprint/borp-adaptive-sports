import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import TextField from '@/components/TextField/TextField';
import TextLink from '@/components/TextLink/TextLink';
import supabase from '~/api/supabase/client';
import { normalizeEmail } from '~/api/supabase/queries/auth';
import { errorMessage } from './errorMessage';
import styles from './styles';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <FormScreen
      title="Welcome back"
      subtitle="Sign in with your email and password"
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      footer={
        <Button
          text={busy ? 'Please wait…' : 'Sign in'}
          disabled={busy}
          onPress={() => void logIn()}
        />
      }
    >
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        editable={!busy}
      />
      <TextField
        label="Password"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        editable={!busy}
        onSubmitEditing={() => void logIn()}
        returnKeyType="done"
      />
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      <View style={styles.links}>
        <TextLink
          text="Forgot password?"
          disabled={busy}
          onPress={() => router.push('/forgot-password')}
        />
        <TextLink
          text="New to BORP? Create an account"
          disabled={busy}
          onPress={() => router.push('/signup')}
        />
      </View>
    </FormScreen>
  );
}
