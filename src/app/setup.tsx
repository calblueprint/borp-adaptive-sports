import { Button, StyleSheet, Text, TextInput } from 'react-native';
import FormScreen from '@/components/FormScreen/FormScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import SetPasswordForm from '@/features/auth/SetPasswordForm';
import { useSignOut } from '@/features/auth/useSignOut';
import ProfileForm from '@/features/profile/ProfileForm';

export default function ProfileSetup() {
  const { session } = useAuth();
  const { signOut, busy, error } = useSignOut();
  const needsPassword =
    session?.user.user_metadata.password_setup_required === true;

  return (
    <FormScreen>
      <Text>
        {needsPassword ? 'Your email is verified' : 'Complete your profile'}
      </Text>
      <Text>Email (from your account)</Text>
      <TextInput
        accessibilityLabel="Account email"
        style={styles.input}
        value={session?.user.email ?? ''}
        editable={false}
      />
      {needsPassword ? (
        // No log out here: leaving now would strand an account with no password.
        <SetPasswordForm />
      ) : (
        <>
          <ProfileForm />
          {error && <Text accessibilityRole="alert">{error}</Text>}
          <Button
            title="Log out"
            disabled={busy}
            onPress={() => void signOut()}
          />
        </>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12 },
});
