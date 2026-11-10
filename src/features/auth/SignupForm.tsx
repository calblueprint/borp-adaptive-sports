import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';
import Button from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import supabase from '~/api/supabase/client';
import { requestSignupCode } from '~/api/supabase/queries/auth';
import CodeInput from './CodeInput';
import { errorMessage } from './errorMessage';
import { useCountdown } from './useCountdown';

export default function SignupForm() {
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

  return (
    <FormScreen>
      {sentEmail ? (
        <>
          <Text>Check your email</Text>
          <Text>Enter the verification code sent to {sentEmail}.</Text>
          <CodeInput
            label="Verification code"
            value={code}
            onChangeText={setCode}
            onSubmit={() => void verifyCode()}
            editable={!busy}
          />
          <Button
            text={busy ? 'Verifying…' : 'Verify code'}
            disabled={busy || !code.trim()}
            onPress={() => void verifyCode()}
          />
          <Button
            text={seconds ? `Resend in ${seconds}s` : 'Resend code'}
            disabled={busy || seconds > 0}
            onPress={() => void sendCode()}
          />
          <Button
            text="Use another email"
            disabled={busy}
            onPress={changeEmail}
          />
        </>
      ) : (
        <>
          <Text>Create an account</Text>
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
          <Text>
            We’ll email you a verification code. Set your password after
            confirming your email.
          </Text>
          <Button
            text={busy ? 'Please wait…' : 'Continue'}
            disabled={busy}
            onPress={() => void sendCode()}
          />
        </>
      )}
      {error && <Text accessibilityRole="alert">{error}</Text>}
      {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
      {!sentEmail && <Link href="/login">Already have an account? Log in</Link>}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
