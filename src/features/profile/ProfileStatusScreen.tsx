import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button/Button';
import Header from '@/components/Header/Header';
import TextLink from '@/components/TextLink/TextLink';
import authStyles from '@/features/auth/styles';
import { useSignOut } from '@/features/auth/useSignOut';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';
import { useProfile } from './ProfileProvider';

// Shown while the profile loads, or if loading it failed
export default function ProfileStatusScreen() {
  const { error, reload } = useProfile();
  const { signOut, busy, error: signOutError } = useSignOut();

  return (
    <SafeAreaView style={styles.safe}>
      <Header />
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={authStyles.error} accessibilityRole="alert">
              {error}
            </Text>
            <Button text="Retry" onPress={reload} />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text style={styles.loading}>Loading your profile…</Text>
          </>
        )}
        {signOutError && (
          <Text style={authStyles.error} accessibilityRole="alert">
            {signOutError}
          </Text>
        )}
        <View style={styles.logOut}>
          <TextLink
            text="Log out"
            disabled={busy}
            onPress={() => void signOut()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, padding: 22, gap: 16, justifyContent: 'center' },
  loading: { ...typography.p2, color: colors.gray, textAlign: 'center' },
  logOut: { alignItems: 'center' },
});
