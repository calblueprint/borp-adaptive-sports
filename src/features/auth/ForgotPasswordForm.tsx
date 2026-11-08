import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import TextField from '@/components/TextField/TextField';
import TextLink from '@/components/TextLink/TextLink';
import { createPasswordRecoveryClient } from '~/api/supabase/client';
import { requestPasswordRecoveryCode } from '~/api/supabase/queries/auth';
import CodeInput from './CodeInput';
import { errorMessage } from './errorMessage';
import PasswordRule from './PasswordRule';
import styles from './styles';
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

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/login');

  const feedback = (
    <>
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {message && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
    </>
  );

  if (step === 'code')
    return (
      <FormScreen
        title="Check your email"
        subtitle={`Enter the recovery code sent to ${sentEmail}.`}
        onBack={goBack}
        footer={
          <Button
            text={busy ? 'Please wait…' : 'Verify code'}
            disabled={busy || !code.trim()}
            onPress={() => void verifyCode()}
          />
        }
      >
        <CodeInput
          label="Recovery code"
          value={code}
          onChangeText={setCode}
          onSubmit={() => void verifyCode()}
          editable={!busy}
        />
        {feedback}
        <View style={styles.links}>
          <TextLink
            text={seconds ? `Resend in ${seconds}s` : 'Resend code'}
            disabled={busy || seconds > 0}
            onPress={() => void sendCode()}
          />
          <TextLink
            text="Use another email"
            disabled={busy}
            onPress={changeEmail}
          />
        </View>
      </FormScreen>
    );

  if (step === 'password')
    return (
      <FormScreen
        title="Choose a new password"
        subtitle={`For ${sentEmail}`}
        onBack={goBack}
        footer={
          <Button
            text={busy ? 'Saving…' : 'Save new password'}
            disabled={busy || !password || !confirmation}
            onPress={() => void savePassword()}
          />
        }
      >
        <TextField
          label="New password"
          secure
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          editable={!busy}
        />
        <TextField
          label="Confirm new password"
          secure
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          editable={!busy}
          returnKeyType="done"
          onSubmitEditing={() => void savePassword()}
        />
        <View style={styles.rules}>
          <PasswordRule
            text="At least 8 characters"
            met={password.length >= 8}
          />
          <PasswordRule
            text="Passwords match"
            met={!!password && password === confirmation}
          />
        </View>
        {feedback}
      </FormScreen>
    );

  if (step === 'complete')
    return (
      <FormScreen
        title="Password reset"
        subtitle="Your password has been reset. Log in with your new password."
        footer={
          <Button
            text="Back to sign in"
            onPress={() => router.replace('/login')}
          />
        }
      >
        {feedback}
      </FormScreen>
    );

  return (
    <FormScreen
      title="Reset your password"
      subtitle="Enter your account email to reset your password."
      onBack={goBack}
      footer={
        <Button
          text={busy ? 'Sending…' : 'Send recovery code'}
          disabled={busy || !email.trim()}
          onPress={() => void sendCode()}
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
        returnKeyType="send"
        onSubmitEditing={() => void sendCode()}
      />
      {feedback}
    </FormScreen>
  );
}
