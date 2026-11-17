import { Stack } from 'expo-router';

// Welcome (index) is always the first screen in this group
export const unstable_settings = {
  anchor: 'index',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
