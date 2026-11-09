import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import TextField from '@/components/TextField/TextField';
import TextLink from '@/components/TextLink/TextLink';
import supabase from '~/api/supabase/client';
import { requestSignupCode } from '~/api/supabase/queries/auth';
import CodeInput from './CodeInput';
import { errorMessage } from './errorMessage';
import styles from './styles';
import { useCountdown } from './useCountdown';

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const { seconds, start, reset } = useCountdown();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Sends the first code, or a new one when resending.
  async function sendCode() {
    if (busy || seconds > 0) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const address = await requestSignupCode(sentEmail ?? email);
      setMessage(
        sentEmail
          ? 'A new code has been sent. Enter the newest code below.'
          : 'Enter the code from your email. After verification, you can set your password.',
      );
      setSentEmail(address);
      setCode('');
      start();
    } catch (cause) {
      setError(
        errorMessage(cause, 'Unable to send the email. Please try again.'),
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (busy || !sentEmail) return;
    setError(null);
    setMessage(null);
    const token = code.trim();
    if (!/^\d+$/.test(token)) {
      setError('Enter the code from your email.');
      return;
    }
    setBusy(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: sentEmail,
        token,
        type: 'email',
      });
      if (verifyError) throw verifyError;
      if (!data.session?.user.email_confirmed_at)
        throw new Error(
          'Email verification did not complete. Request a new code.',
        );
    } catch (cause) {
      setError(
        errorMessage(cause, 'Unable to verify your email. Please try again.'),
      );
    } finally {
      setBusy(false);
    }
  }

  function changeEmail() {
    setSentEmail(null);
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

  if (sentEmail)
    return (
      <FormScreen
        title="Check your email"
        subtitle={`Enter the verification code sent to ${sentEmail}.`}
        onBack={goBack}
        footer={
          <Button
            text={busy ? 'Verifying…' : 'Verify code'}
            disabled={busy || !code.trim()}
            onPress={() => void verifyCode()}
          />
        }
      >
        <CodeInput
          label="Verification code"
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

  return (
    <FormScreen
      title="Create an account"
      subtitle="Sign up with your email"
      onBack={goBack}
      footer={
        <Button
          text={busy ? 'Please wait…' : 'Continue'}
          disabled={busy}
          onPress={() => void sendCode()}
        />
      }
    >
      <TextField
        label="Email"
        helper="We’ll email you a verification code. Set your password after confirming your email."
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        editable={!busy}
      />
      {feedback}
      <View style={styles.links}>
        <TextLink
          text="Already have an account? Sign in"
          disabled={busy}
          onPress={goBack}
        />
      </View>
    </FormScreen>
  );
}
