import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { useScreenGroup } from '@/features/auth/useScreenGroup';
import { ProfileProvider } from '@/features/profile/ProfileProvider';

function AuthNavigator() {
  const { isLoading, error } = useAuth();
  const screen = useScreenGroup();

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={screen === 'main'}>
          <Stack.Screen name="(main)" />
        </Stack.Protected>
        <Stack.Protected guard={screen === 'setup'}>
          <Stack.Screen name="setup" />
        </Stack.Protected>
        <Stack.Protected guard={screen === 'status'}>
          <Stack.Screen name="profile-status" />
        </Stack.Protected>
        <Stack.Protected guard={screen === 'auth'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
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
