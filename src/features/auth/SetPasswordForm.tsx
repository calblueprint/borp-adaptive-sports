import { useState } from 'react';
import { Text } from 'react-native';
import Button from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import TextField from '@/components/TextField/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import supabase from '~/api/supabase/client';
import PasswordRule from './PasswordRule';
import styles from './styles';

// Shown right after email verification. No back or log out here:
// leaving now would strand an account with no password.
export default function SetPasswordForm() {
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password,
        data: { password_setup_required: false },
      });
      if (passwordError) throw passwordError;
      setPassword('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to set your password. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen
      title="Your email is verified"
      subtitle="Please set your password"
      footer={
        <Button
          text={busy ? 'Saving…' : 'Continue'}
          disabled={busy || password.length < 8}
          onPress={() => void submit()}
        />
      }
    >
      <TextField label="Email" readOnly value={session?.user.email ?? ''} />
      <TextField
        label="Password"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        editable={!busy}
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />
      <PasswordRule text="At least 8 characters" met={password.length >= 8} />
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </FormScreen>
  );
}
