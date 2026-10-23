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
import ActionButton from '@/components/Button/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import supabase from '~/api/supabase/client';
import {
  createProfile,
  profileErrorMessage,
} from '~/api/supabase/queries/profiles';

export default function ProfileSetup() {
  const { session } = useAuth();
  const { profile, reload } = useProfile();
  const needsPassword =
    session?.user.user_metadata.password_setup_required === true;
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? '');
  const [affiliation, setAffiliation] = useState(profile?.affiliation ?? '');
  const [mobilityDevice, setMobilityDevice] = useState(
    profile?.mobility_device ?? '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setError(null);
    if (needsPassword) {
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
      return;
    }
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    const normalizedPhone = phoneNumber.replace(/[\s().-]/g, '');
    if (!/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      setError(
        'Enter a valid phone number with its country code, for example +15105550123.',
      );
      return;
    }
    setBusy(true);
    try {
      const details = {
        name: name.trim(),
        phone_number: normalizedPhone,
        affiliation: affiliation.trim() || null,
        mobility_device: mobilityDevice.trim() || null,
      };
      if (profile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(details)
          .eq('id', profile.id)
          .select('id')
          .single();
        if (updateError) throw updateError;
      } else {
        await createProfile(details);
      }
      reload();
    } catch (cause) {
      setError(profileErrorMessage(cause));
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
          {needsPassword ? 'Your email is verified' : 'Complete your profile'}
        </Text>
        <Text>Email (from your account)</Text>
        <TextInput
          accessibilityLabel="Account email"
          style={styles.input}
          value={session?.user.email ?? ''}
          editable={false}
        />
        {needsPassword ? (
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
              title={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword(value => !value)}
            />
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
            <Text>Phone number (required)</Text>
            <TextInput
              accessibilityLabel="Phone number (required)"
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+15105550123"
              editable={!busy}
            />
            <Text>Include your country code.</Text>
            <Text>Role: {profile?.role ?? 'surveyor'}</Text>
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
        <ActionButton
          text={busy ? 'Saving…' : needsPassword ? 'Continue' : 'Save profile'}
          disabled={
            busy ||
            (needsPassword
              ? password.length < 8
              : !name.trim() || !phoneNumber.trim())
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
