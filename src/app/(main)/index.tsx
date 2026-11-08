import { Button, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSignOut } from '@/features/auth/useSignOut';
import { useProfile } from '@/features/profile/ProfileProvider';

export default function HomeScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { signOut, busy, error } = useSignOut();

  return (
    <View style={styles.container}>
      <Text>Home page</Text>
      <Text>Welcome to BORP, {profile?.name}!</Text>
      <Text>Signed in as {session?.user.email}</Text>
      {error && <Text accessibilityRole="alert">{error}</Text>}

      <Link href="/survey">Go to survey</Link>

      <Button
        title={busy ? 'Logging out…' : 'Log out'}
        disabled={busy}
        onPress={() => void signOut()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
});
