import { useState } from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { Link } from 'expo-router';
import supabase from '~/api/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function resendConfirmation() {
    if (isSubmitting) return;
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter your account email address first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
      });
      if (resendError) setError(resendError.message);
      else
        setMessage(
          'If your account needs confirmation, check your inbox for a new link. Open the newest email once, then return here to log in.',
        );
    } catch {
      setError(
        'Unable to connect. Check your internet connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit() {
    if (isSubmitting) return;
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password || (isSignup && password.length < 6)) {
      setError(
        isSignup
          ? 'Use a password with at least 6 characters.'
          : 'Enter your password.',
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const credentials = { email: trimmedEmail, password };
      const { data, error: authError } = isSignup
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);
      const emailAlreadyExists =
        isSignup &&
        (authError?.code === 'user_already_exists' ||
          authError?.code === 'email_exists' ||
          (!authError && !data.session && data.user?.identities?.length === 0));

      if (emailAlreadyExists) {
        setError(
          'An account with this email already exists. Please log in instead.',
        );
      } else if (authError) setError(authError.message);
      else if (isSignup && !data.session) {
        setPassword('');
        setMessage(
          'Check your email to confirm your account, then return here to log in.',
        );
      }
    } catch {
      setError(
        'Unable to connect. Check your internet connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
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
          editable={!isSubmitting}
        />
        <Text>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          editable={!isSubmitting}
          onSubmitEditing={() => void submit()}
          returnKeyType="done"
        />
        {error && <Text accessibilityRole="alert">{error}</Text>}
        {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        <Button
          title={
            isSubmitting
              ? 'Please wait…'
              : isSignup
                ? 'Create account'
                : 'Log in'
          }
          disabled={isSubmitting}
          onPress={() => void submit()}
        />
        {!isSubmitting && (
          <Link href={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Already have an account? Log in' : 'Create an account'}
          </Link>
        )}
        <Button
          title="Resend confirmation email"
          disabled={isSubmitting}
          onPress={() => void resendConfirmation()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
