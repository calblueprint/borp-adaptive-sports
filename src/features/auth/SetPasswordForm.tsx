import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import Button from '@/components/Button/Button';
import supabase from '~/api/supabase/client';

export default function SetPasswordForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <>
      <Text>Set your password</Text>
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
      <Button
        text={showPassword ? 'Hide password' : 'Show password'}
        onPress={() => setShowPassword(value => !value)}
      />
      {error && <Text accessibilityRole="alert">{error}</Text>}
      <Button
        text={busy ? 'Saving…' : 'Continue'}
        disabled={busy || password.length < 8}
        onPress={() => void submit()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
