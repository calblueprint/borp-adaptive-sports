import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerTransparent: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="survey/index" options={{ title: 'Survey' }} />
      <Stack.Screen
        name="how-you-go"
        options={{ title: 'How you go on trails' }}
      />
    </Stack>
  );
}
