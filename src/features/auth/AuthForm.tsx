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
import { Link, useRouter } from 'expo-router';
import ActionButton from '@/components/Button/Button';
import supabase from '~/api/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
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

  function enterExistingCode() {
    if (isSubmitting) return;
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter the email address that received the code first.');
      return;
    }
    setSentEmail(trimmedEmail);
    setPassword('');
    setCode('');
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
    if (!isSignup && !password) {
      setError('Enter your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: authError } = isSignup
        ? await supabase.auth.signInWithOtp({
            email: trimmedEmail,
            options: {
              shouldCreateUser: true,
              data: { password_setup_required: true },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
      if (authError?.code === 'email_not_confirmed') {
        setSentEmail(trimmedEmail);
        setPassword('');
        setCode('');
        setMessage(
          'Enter your email verification code, or request a new one below.',
        );
        return;
      }
      if (authError?.code === 'invalid_credentials') {
        setError('Incorrect email or password. Please try again.');
        return;
      }
      if (authError) throw authError;
      if (isSignup) {
        setSentEmail(trimmedEmail);
        setPassword('');
        setCode('');
        setSeconds(60);
        setMessage(
          'Enter the code from your email. After verification, you can set your password.',
        );
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

  async function resendConfirmation() {
    if (isSubmitting || seconds > 0 || !sentEmail) return;
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: sentEmail,
        options: { shouldCreateUser: false },
      });
      if (resendError) throw resendError;
      setSeconds(60);
      setCode('');
      setMessage('A new code has been sent. Enter the newest code below.');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to send the email. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode() {
    if (isSubmitting || !sentEmail) return;
    setError(null);
    setMessage(null);
    const token = code.trim();
    if (!/^\d+$/.test(token)) {
      setError('Enter the code from your email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error: verificationError } = await supabase.auth.verifyOtp({
        email: sentEmail,
        token,
        type: 'email',
      });
      if (verificationError) throw verificationError;
      if (!data.session?.user.email_confirmed_at)
        throw new Error(
          'Email verification did not complete. Request a new code.',
        );
      setCode('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to verify your email. Please try again.',
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
            <Text>Check your email</Text>
            <Text>Enter the verification code sent to {sentEmail}.</Text>
            <Text>Verification code</Text>
            <TextInput
              accessibilityLabel="Verification code"
              placeholder="Enter your email code"
              autoFocus
              style={styles.input}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
              editable={!isSubmitting}
              onSubmitEditing={() => void verifyCode()}
              returnKeyType="done"
            />
            <ActionButton
              text={isSubmitting ? 'Verifying…' : 'Verify code'}
              disabled={isSubmitting || !code.trim()}
              onPress={() => void verifyCode()}
            />
            <Button
              title={seconds ? `Resend in ${seconds}s` : 'Resend code'}
              disabled={isSubmitting || seconds > 0}
              onPress={() => void resendConfirmation()}
            />
            <Button
              title="Use another email"
              disabled={isSubmitting}
              onPress={() => {
                setSentEmail(null);
                setCode('');
                setMessage(null);
                setError(null);
              }}
            />
          </>
        ) : (
          <>
            <Text>{isSignup ? 'Create an account' : 'Log in'}</Text>
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
              <Text>
                We’ll email you a verification code. Set your password after
                confirming your email.
              </Text>
            ) : (
              <>
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
                  editable={!isSubmitting}
                  onSubmitEditing={() => void submit()}
                  returnKeyType="done"
                />
                <Button
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword(value => !value)}
                />
              </>
            )}
            <ActionButton
              text={
                isSubmitting ? 'Please wait…' : isSignup ? 'Continue' : 'Log in'
              }
              disabled={isSubmitting}
              onPress={() => void submit()}
            />
            <Button
              title="Already have a verification code?"
              disabled={isSubmitting}
              onPress={enterExistingCode}
            />
          </>
        )}
        {error && <Text accessibilityRole="alert">{error}</Text>}
        {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        {!sentEmail &&
          (isSignup ? (
            <Link href="/login">Already have an account? Log in</Link>
          ) : (
            <ActionButton
              text="Create account"
              disabled={isSubmitting}
              onPress={() => router.push('/signup')}
            />
          ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
