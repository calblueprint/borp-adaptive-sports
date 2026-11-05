import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import ActionButton from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import { createPasswordRecoveryClient } from '~/api/supabase/client';
import { requestPasswordRecoveryCode } from '~/api/supabase/queries/auth';
import CodeInput from './CodeInput';
import { errorMessage } from './errorMessage';
import { useCountdown } from './useCountdown';

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
  const { seconds, start, reset } = useCountdown();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Sends the first code, or a new one when resending.
  async function sendCode() {
    if (busy || seconds > 0) return;
    setError(null);
    setBusy(true);
    try {
      const address = await requestPasswordRecoveryCode(
        step === 'code' ? sentEmail : email,
        recoveryClient,
      );
      setSentEmail(address);
      setCode('');
      start();
      setStep('code');
      setMessage(
        'We’ve sent a recovery code. Enter the newest code from your email below.',
      );
    } catch (cause) {
      setError(
        errorMessage(
          cause,
          'Unable to send the recovery email. Please try again.',
        ),
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
        errorMessage(cause, 'Unable to verify the code. Please try again.'),
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
      // Log out every device, including this temporary recovery session.
      await recoveryClient.auth.signOut({ scope: 'global' }).catch(() => {});
    } catch (cause) {
      setError(
        errorMessage(cause, 'Unable to reset your password. Please try again.'),
      );
    } finally {
      setBusy(false);
    }
  }

  function changeEmail() {
    setStep('email');
    setCode('');
    reset();
    setError(null);
    setMessage(null);
  }

  return (
    <FormScreen>
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
          <CodeInput
            label="Recovery code"
            value={code}
            onChangeText={setCode}
            onSubmit={() => void verifyCode()}
            editable={!busy}
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
            onPress={changeEmail}
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
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
