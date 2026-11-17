import { Stack } from 'expo-router';
import { useProfile } from '@/features/profile/ProfileProvider';

export default function AppLayout() {
  const { profile } = useProfile();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={profile?.role === 'admin'}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}
