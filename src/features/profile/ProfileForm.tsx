import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import Button from '@/components/Button/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { createProfile, updateProfile } from '~/api/supabase/queries/profiles';

// Stores numbers as +<country code><number>; 10-digit numbers are assumed to be US.
function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('+'))
    return /^[1-9]\d{6,14}$/.test(digits) ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export default function ProfileForm() {
  const { session } = useAuth();
  const { profile, reload } = useProfile();
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
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    const normalizedPhone = normalizePhone(phoneNumber);
    if (!normalizedPhone) {
      setError('Enter a valid phone number, for example 510-555-0123.');
      return;
    }
    if (!session) return;
    setBusy(true);
    try {
      const details = {
        name: name.trim(),
        phone_number: normalizedPhone,
        affiliation: affiliation.trim() || null,
        mobility_device: mobilityDevice.trim() || null,
      };
      if (profile) {
        await updateProfile(profile.id, details);
      } else {
        await createProfile(session.user, details);
      }
      reload();
    } catch (cause) {
      console.error('Failed to save profile', cause);
      setError('Unable to save your profile. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
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
        placeholder="510-555-0123"
        editable={!busy}
      />
      <Text>
        For numbers outside the US, start with + and the country code.
      </Text>
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
      {error && <Text accessibilityRole="alert">{error}</Text>}
      <Button
        text={busy ? 'Saving…' : 'Save profile'}
        disabled={busy || !name.trim() || !phoneNumber.trim()}
        onPress={() => void submit()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
