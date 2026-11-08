import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import Header from '@/components/Header/Header';
import TextLink from '@/components/TextLink/TextLink';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSignOut } from '@/features/auth/useSignOut';
import { useProfile } from '@/features/profile/ProfileProvider';
import styles from './styles';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { signOut, busy, error } = useSignOut();

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to BORP, {profile?.name}!</Text>
        <Text style={styles.subtitle}>Signed in as {session?.user.email}</Text>
        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button text="Start survey" onPress={() => router.push('/survey')} />
        <TextLink
          text={busy ? 'Logging out…' : 'Log out'}
          disabled={busy}
          onPress={() => void signOut()}
        />
      </View>
    </SafeAreaView>
  );
}
