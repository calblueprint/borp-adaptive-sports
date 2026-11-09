import { ReactNode, useState } from 'react';
import { Text } from 'react-native';
import Button from '@/components/Button/Button';
import FormScreen from '@/components/FormScreen/FormScreen';
import TextField from '@/components/TextField/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import authStyles from '@/features/auth/styles';
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

// `children` is shown under the fields (e.g. a log out link)
export default function ProfileForm({ children }: { children?: ReactNode }) {
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
    <FormScreen
      title="We would love to know you"
      subtitle="Enter your profile details"
      footer={
        <Button
          text={busy ? 'Saving…' : 'Continue'}
          disabled={busy || !name.trim() || !phoneNumber.trim()}
          onPress={() => void submit()}
        />
      }
    >
      <TextField label="Email" readOnly value={session?.user.email ?? ''} />
      <TextField
        label="Name"
        accessibilityLabel="Name (required)"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        autoCapitalize="words"
        editable={!busy}
      />
      <TextField
        label="Phone Number"
        accessibilityLabel="Phone number (required)"
        helper="For numbers outside the US, start with + and the country code."
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="510-555-0123"
        editable={!busy}
      />
      <TextField label="Role" readOnly value={profile?.role ?? 'surveyor'} />
      <TextField
        label="Affiliation (optional)"
        value={affiliation}
        onChangeText={setAffiliation}
        editable={!busy}
      />
      <TextField
        label="Mobility device (optional)"
        value={mobilityDevice}
        onChangeText={setMobilityDevice}
        editable={!busy}
      />
      {error && (
        <Text style={authStyles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {children}
    </FormScreen>
  );
}
