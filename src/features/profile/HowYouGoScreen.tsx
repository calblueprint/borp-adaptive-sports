import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import { useProfile } from '@/features/profile/ProfileProvider';
import { updateProfile } from '~/api/supabase/queries/profiles';
import styles from './styles';

const OPTIONS = [
  'Walking',
  'Bike',
  'Scooter',
  'Manual chair',
  'Power chair',
  'Walker',
  'Cane or crutches',
];

export default function HowYouGoScreen() {
  const { profile, reload } = useProfile();
  const router = useRouter();
  const [choice, setChoice] = useState<string | null>(
    profile?.mobility_device ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!profile || !choice) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(profile.id, {
        name: profile.name,
        phone_number: profile.phone_number,
        affiliation: profile.affiliation,
        mobility_device: choice,
      });
      await reload();
      // Profile reads from ProfileProvider, so reload() already updated it
      router.back();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <BackButton />
        <Text style={styles.heading}>How you go on trails</Text>
        <View style={styles.chips}>
          {OPTIONS.map(option => (
            <Pressable
              key={option}
              onPress={() => setChoice(option)}
              style={[styles.chip, choice === option && styles.chipSelected]}
            >
              <Text
                style={[
                  styles.chipText,
                  choice === option && styles.chipTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.footer}>
          <Button
            text={busy ? 'Saving…' : 'Save'}
            onPress={() => void save()}
            disabled={busy || !choice}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
