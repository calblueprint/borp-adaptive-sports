import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Link, Redirect } from 'expo-router';
import { completeEmailLink } from '@/features/auth/completeEmailLink';

export default function AuthCallback() {
  const url = Linking.useURL();
  const started = useRef<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || started.current === url) return;
    started.current = url;
    setError(null);
    async function verify() {
      try {
        if (Platform.OS === 'web')
          window.history.replaceState(null, '', '/auth/callback');
        await completeEmailLink(url!);
        setDone(true);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to verify this link. Please try again.',
        );
      }
    }
    void verify();
  }, [url]);

  if (done) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      {error ? (
        <>
          <Text accessibilityRole="alert">{error}</Text>
          <Link href="/signup">Request another email link</Link>
          <Link href="/login">Back to login</Link>
        </>
      ) : (
        <>
          <ActivityIndicator />
          <Text>Verifying your email…</Text>
        </>
      )}
    </View>
  );
}
