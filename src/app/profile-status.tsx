import { useState } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import { useProfile } from '@/features/profile/ProfileProvider';
import supabase from '~/api/supabase/client';

export default function ProfileStatus() {
  const { error, reload } = useProfile();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    setSignOutError(null);
    try {
      const { error: authError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (authError) throw authError;
    } catch {
      setSignOutError('Unable to log out. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      {error ? (
        <>
          <Text accessibilityRole="alert">{error}</Text>
          <Button title="Retry" onPress={reload} />
        </>
      ) : (
        <>
          <ActivityIndicator />
          <Text>Loading your profile…</Text>
        </>
      )}
      {signOutError && <Text accessibilityRole="alert">{signOutError}</Text>}
      <Button title="Log out" disabled={busy} onPress={() => void signOut()} />
    </View>
  );
}
