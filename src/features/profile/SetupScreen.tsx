import { Text, View } from 'react-native';
import TextLink from '@/components/TextLink/TextLink';
import { useAuth } from '@/features/auth/AuthProvider';
import SetPasswordForm from '@/features/auth/SetPasswordForm';
import authStyles from '@/features/auth/styles';
import { useSignOut } from '@/features/auth/useSignOut';
import ProfileForm from './ProfileForm';

// After verifying their email: set a password first, then fill in the profile
export default function SetupScreen() {
  const { session } = useAuth();
  const { signOut, busy, error } = useSignOut();
  const needsPassword =
    session?.user.user_metadata.password_setup_required === true;

  if (needsPassword) return <SetPasswordForm />;

  return (
    <ProfileForm>
      {error && (
        <Text style={authStyles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      <View style={authStyles.links}>
        <TextLink
          text="Log out"
          disabled={busy}
          onPress={() => void signOut()}
        />
      </View>
    </ProfileForm>
  );
}
