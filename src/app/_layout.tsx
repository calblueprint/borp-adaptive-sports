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
      <Stack>
        <Stack.Protected guard={verified && !!profile}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected
          guard={verified && !profileLoading && !profileError && !profile}
        >
          <Stack.Screen
            name="setup"
            options={{ title: 'Set up your profile', headerBackVisible: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={verified && (profileLoading || !!profileError)}>
          <Stack.Screen
            name="profile-status"
            options={{ title: 'Loading profile', headerBackVisible: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!verified}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen
          name="auth/callback"
          options={{ title: 'Verify email', headerBackVisible: false }}
        />
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
