import { Stack } from 'expo-router';
import { useProfile } from '@/features/profile/ProfileProvider';

export default function AppLayout() {
  const { profile } = useProfile();
  return (
    <Stack screenOptions={{ headerTransparent: false }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="survey/index" options={{ title: 'Survey' }} />
      <Stack.Screen name="trails/index" options={{ title: 'Trails' }} />
      <Stack.Protected guard={profile?.role === 'admin'}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
