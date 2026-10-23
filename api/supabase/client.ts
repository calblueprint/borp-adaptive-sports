import 'react-native-url-polyfill/auto';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'No Supabase environment variables detected, please make sure they are in place!',
  );
}

const SESSION_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: SESSION_STORAGE_KEY,
  },
});

export async function readSavedSession(): Promise<Session | null> {
  const saved = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!saved) return null;
  try {
    const session = JSON.parse(saved);
    return typeof session.access_token === 'string' &&
      typeof session.refresh_token === 'string' &&
      typeof session.expires_at === 'number' &&
      typeof session.user?.id === 'string'
      ? session
      : null;
  } catch {
    return null;
  }
}

export default supabase;
