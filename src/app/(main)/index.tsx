import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import supabase from '~/api/supabase/client';

export default function HomeScreen() {
  const { session } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setIsSigningOut(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (signOutError) setError(signOutError.message);
    } catch {
      setError('Unable to log out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Welcome to BORP!</Text>
      <Text>Signed in as {session?.user.email}</Text>
      {error && <Text accessibilityRole="alert">{error}</Text>}
      <Button
        title={isSigningOut ? 'Logging out…' : 'Log out'}
        disabled={isSigningOut}
        onPress={() => void signOut()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
});
