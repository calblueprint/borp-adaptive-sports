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
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import supabase from '~/api/supabase/client';
import { createProfile } from '~/api/supabase/queries/profiles';

export default function ProfileSetup() {
  const { session } = useAuth();
  const { reload } = useProfile();
  const [step, setStep] = useState<'password' | 'profile'>(
    session?.user.user_metadata.profile_password_set ? 'profile' : 'password',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [mobilityDevice, setMobilityDevice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validPassword =
    password.length >= 10 && /[^a-zA-Z0-9\s]/.test(password);

  async function submit() {
    if (busy) return;
    setError(null);
    if (step === 'password' && !validPassword) {
      setError('Use at least 10 characters and a special character.');
      return;
    }
    if (step === 'profile' && !name.trim()) {
      setError('Enter your name.');
      return;
    }
    setBusy(true);
    try {
      if (step === 'password') {
        const { error: passwordError } = await supabase.auth.updateUser({
          password,
          data: { profile_password_set: true },
        });
        if (passwordError) throw passwordError;
        setPassword('');
        setStep('profile');
      } else {
        await createProfile({
          name: name.trim(),
          affiliation: affiliation.trim() || null,
          mobility_device: mobilityDevice.trim() || null,
        });
        reload();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to save. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (signOutError) throw signOutError;
    } catch {
      setError('Unable to log out. Please try again.');
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
        <Text>
          {step === 'password'
            ? 'Your email is verified'
            : 'We would love to know you'}
        </Text>
        <Text>Email (from your account)</Text>
        <TextInput
          accessibilityLabel="Account email"
          style={styles.input}
          value={session?.user.email ?? ''}
          editable={false}
        />
        {step === 'password' ? (
          <>
            <Text>Set a password</Text>
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
            <Button
              title={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword(value => !value)}
            />
            <Text>
              {password.length >= 10 ? '✓' : '○'} At least 10 characters
            </Text>
            <Text>
              {/[^a-zA-Z0-9\s]/.test(password) ? '✓' : '○'} Contains a special
              character
            </Text>
          </>
        ) : (
          <>
            <Text>Name (required)</Text>
            <TextInput
              accessibilityLabel="Name (required)"
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoComplete="name"
              autoCapitalize="words"
              editable={!busy}
            />
            <Text>Role: Surveyor</Text>
            <Text>Affiliation (optional)</Text>
            <TextInput
              accessibilityLabel="Affiliation (optional)"
              style={styles.input}
              value={affiliation}
              onChangeText={setAffiliation}
              editable={!busy}
            />
            <Text>Mobility device (optional)</Text>
            <TextInput
              accessibilityLabel="Mobility device (optional)"
              style={styles.input}
              value={mobilityDevice}
              onChangeText={setMobilityDevice}
              editable={!busy}
            />
          </>
        )}
        {error && <Text accessibilityRole="alert">{error}</Text>}
        <Button
          title={
            busy
              ? 'Saving…'
              : step === 'password'
                ? 'Continue'
                : 'Create profile'
          }
          disabled={
            busy || (step === 'password' ? !validPassword : !name.trim())
          }
          onPress={() => void submit()}
        />
        <Button
          title="Log out"
          disabled={busy}
          onPress={() => void signOut()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
