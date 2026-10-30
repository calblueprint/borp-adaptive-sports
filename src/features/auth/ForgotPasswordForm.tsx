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
import { useRouter } from 'expo-router';
import ActionButton from '@/components/Button/Button';
import { createPasswordRecoveryClient } from '~/api/supabase/client';
import { requestPasswordRecoveryCode } from '~/api/supabase/queries/auth';

type Step = 'email' | 'code' | 'password' | 'complete';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [recoveryClient] = useState(createPasswordRecoveryClient);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
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

  async function sendCode() {
    if (busy || seconds > 0) return;
    setError(null);
    const address = step === 'code' ? sentEmail : email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const normalizedEmail = await requestPasswordRecoveryCode(
        address,
        recoveryClient,
      );
      setSentEmail(normalizedEmail);
      setCode('');
      setSeconds(60);
      setStep('code');
      setMessage(
        'We’ve sent a recovery code. Enter the newest code from your email below.',
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to send the recovery email. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (busy) return;
    setError(null);
    const token = code.trim();
    if (!/^\d+$/.test(token)) {
      setError('Enter the recovery code from your email.');
      return;
    }
    setBusy(true);
    try {
      const { data, error: verifyError } = await recoveryClient.auth.verifyOtp({
        email: sentEmail,
        token,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;
      if (!data.session) throw new Error('Request a new code and try again.');
      setCode('');
      setMessage(null);
      setStep('password');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to verify the code. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function savePassword() {
    if (busy) return;
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await recoveryClient.auth.updateUser({
        password,
        data: { password_setup_required: false },
      });
      if (updateError) throw updateError;
      setPassword('');
      setConfirmation('');
      setStep('complete');
      // Dispose of the temporary recovery session after the password is saved.
      await recoveryClient.auth.signOut({ scope: 'local' }).catch(() => {});
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to reset your password. Please try again.',
      );
    } finally {
      setBusy(false);
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
        {step === 'email' && (
          <>
            <Text>Enter your account email to reset your password.</Text>
            <Text>Email</Text>
            <TextInput
              accessibilityLabel="Account email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!busy}
              returnKeyType="send"
              onSubmitEditing={() => void sendCode()}
            />
            <ActionButton
              text={busy ? 'Sending…' : 'Send recovery code'}
              disabled={busy || !email.trim()}
              onPress={() => void sendCode()}
            />
          </>
        )}
        {step === 'code' && (
          <>
            <Text>Check your email at {sentEmail}.</Text>
            <Text>Recovery code</Text>
            <TextInput
              accessibilityLabel="Recovery code"
              placeholder="Enter your recovery code"
              style={styles.input}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={() => void verifyCode()}
            />
            <ActionButton
              text={busy ? 'Please wait…' : 'Verify code'}
              disabled={busy || !code.trim()}
              onPress={() => void verifyCode()}
            />
            <Button
              title={seconds ? `Resend in ${seconds}s` : 'Resend code'}
              disabled={busy || seconds > 0}
              onPress={() => void sendCode()}
            />
            <Button
              title="Use another email"
              disabled={busy}
              onPress={() => {
                setStep('email');
                setCode('');
                setSeconds(0);
                setError(null);
                setMessage(null);
              }}
            />
          </>
        )}
        {step === 'password' && (
          <>
            <Text>Choose a new password for {sentEmail}.</Text>
            <Text>New password</Text>
            <TextInput
              accessibilityLabel="New password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              editable={!busy}
            />
            <Text>Use at least 8 characters.</Text>
            <Text>Confirm new password</Text>
            <TextInput
              accessibilityLabel="Confirm new password"
              style={styles.input}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={() => void savePassword()}
            />
            <Button
              title={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword(value => !value)}
            />
            <ActionButton
              text={busy ? 'Saving…' : 'Save new password'}
              disabled={busy || !password || !confirmation}
              onPress={() => void savePassword()}
            />
          </>
        )}
        {step === 'complete' && (
          <Text accessibilityLiveRegion="polite">
            Your password has been reset. Log in with your new password.
          </Text>
        )}
        {error && <Text accessibilityRole="alert">{error}</Text>}
        {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        <Button
          title="Back to log in"
          disabled={busy}
          onPress={() => router.replace('/login')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
