import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ title: 'Log in' }} />
      <Stack.Screen name="signup" options={{ title: 'Create account' }} />
    </Stack>
  );
}
