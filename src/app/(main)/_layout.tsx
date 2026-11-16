import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* No swiping back to the survey after it's sent */}
      <Stack.Screen name="survey/sent" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
