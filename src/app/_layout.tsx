import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import {
  ProfileProvider,
  useProfile,
} from '@/features/profile/ProfileProvider';

function AuthNavigator() {
  const { session, isLoading, error } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();
  const verified = !!session?.user.email_confirmed_at;
  const needsPassword =
    session?.user.user_metadata.password_setup_required === true;
  const hasCompleteProfile =
    !!profile?.name?.trim() && !!profile?.phone_number?.trim();
  // Exactly one screen group is reachable, checked in priority order.
  const screen = !verified
    ? 'auth'
    : profileLoading || profileError
      ? 'status'
      : needsPassword || !hasCompleteProfile
        ? 'setup'
        : 'main';
  if (isLoading)
    return (
      <ActivityIndicator
        accessibilityLabel="Restoring session"
        style={{ flex: 1 }}
      />
    );
  return (
    <View style={{ flex: 1 }}>
      {error && <Text accessibilityRole="alert">{error}</Text>}
      <Stack screenOptions={{ headerTransparent: false }}>
        <Stack.Protected guard={screen === 'main'}>
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={screen === 'setup'}>
          <Stack.Screen
            name="setup"
            options={{ title: 'Set up your profile', headerBackVisible: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={screen === 'status'}>
          <Stack.Screen
            name="profile-status"
            options={{ title: 'Loading profile', headerBackVisible: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={screen === 'auth'}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="prototype" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

function StackLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <AuthNavigator />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default StackLayout;
