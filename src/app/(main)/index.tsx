import { Button, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSignOut } from '@/features/auth/useSignOut';
import { useProfile } from '@/features/profile/ProfileProvider';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

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
      <Link href="/survey" style={styles.link}>
        Survey
      </Link>
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
  link: {
    ...typography.p1,
    color: colors.blue,
    textDecorationLine: 'underline',
  },
});
