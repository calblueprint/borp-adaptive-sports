import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerTransparent: false }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="survey/index" options={{ title: 'Survey' }} />
      <Stack.Screen name="trails/index" options={{ title: 'Trails' }} />
    </Stack>
  );
}
