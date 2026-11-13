import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin dashboard' }} />
      <Stack.Screen name="sites/[siteId]" options={{ title: 'Site surveys' }} />
      <Stack.Screen
        name="surveys/[surveyId]"
        options={{ title: 'Survey details' }}
      />
    </Stack>
  );
}
