import { useEffect, useState } from 'react';
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
import { getAuthRedirectUrl } from '@/features/auth/redirect';
import supabase from '~/api/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(
      () => setSeconds(value => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [seconds]);

  async function submit(resend = false) {
    if (isSubmitting || (resend && seconds > 0)) return;
    setError(null);
    setMessage(null);
    const trimmedEmail = resend ? sentEmail! : email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isSignup && !password) {
      setError('Enter your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isSignup) {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
            shouldCreateUser: true,
          },
        });
        if (authError) throw authError;
        setSentEmail(trimmedEmail);
        setSeconds(30);
        setMessage(
          'Open the newest link in your email to verify and continue.',
        );
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (authError) throw authError;
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to connect. Check your connection and try again.',
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
        {sentEmail ? (
          <>
            <Text>Please check your email to finish</Text>
            <Text>A verification link has been sent to {sentEmail}.</Text>
            <Button
              title={seconds ? `Resend in ${seconds}s` : 'Resend email'}
              disabled={isSubmitting || seconds > 0}
              onPress={() => void submit(true)}
            />
            <Button
              title="Use a different email"
              disabled={isSubmitting}
              onPress={() => {
                setSentEmail(null);
                setMessage(null);
                setError(null);
              }}
            />
          </>
        ) : (
          <>
            <Text>{isSignup ? 'Continue with email' : 'Log in'}</Text>
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
            {isSignup ? (
              <Text>We’ll send you a link to verify your email.</Text>
            ) : (
              <>
                <Text>Password</Text>
                <TextInput
                  accessibilityLabel="Password"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  editable={!isSubmitting}
                  onSubmitEditing={() => void submit()}
                  returnKeyType="done"
                />
              </>
            )}
            <Button
              title={
                isSubmitting
                  ? 'Please wait…'
                  : isSignup
                    ? 'Send verification link'
                    : 'Log in'
              }
              disabled={isSubmitting}
              onPress={() => void submit()}
            />
          </>
        )}
        {error && <Text accessibilityRole="alert">{error}</Text>}
        {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        <Link href={isSignup ? '/login' : '/signup'}>
          {isSignup
            ? 'Already have a password? Log in'
            : 'Create an account or sign in with an email link'}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
