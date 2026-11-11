import { ActivityIndicator, Text, View } from 'react-native';
import Button from '@/components/Button/Button';
import { useSignOut } from '@/features/auth/useSignOut';
import { useProfile } from '@/features/profile/ProfileProvider';

export default function ProfileStatus() {
  const { error, reload } = useProfile();
  const { signOut, busy, error: signOutError } = useSignOut();
  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      {error ? (
        <>
          <Text accessibilityRole="alert">{error}</Text>
          <Button text="Retry" onPress={reload} />
        </>
      ) : (
        <>
          <ActivityIndicator />
          <Text>Loading your profile…</Text>
        </>
      )}
      {signOutError && <Text accessibilityRole="alert">{signOutError}</Text>}
      <Button text="Log out" disabled={busy} onPress={() => void signOut()} />
    </View>
  );
}
