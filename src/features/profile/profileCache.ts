import type { Profile } from '@/lib/profiles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Constants } from '~/api/supabase/database.types';

// Bump when the Profile shape changes, so old saved copies are ignored
const CACHE_VERSION = 'v1';
const cacheKey = (userId: string) => `borp:profile:${CACHE_VERSION}:${userId}`;

const isString = (v: unknown) => typeof v === 'string';
const isStringOrNull = (v: unknown) => v === null || typeof v === 'string';

// One check per Profile field. Typed against Profile, so adding a field to Profile without a check here is a TypeScript error.
const fieldChecks: Record<keyof Profile, (value: unknown) => boolean> = {
  id: isString,
  name: isString,
  email: isString,
  // Allowed roles come from the database, so new roles are accepted automatically
  role: v => (Constants.public.Enums.role as readonly unknown[]).includes(v),
  phone_number: isStringOrNull,
  affiliation: isStringOrNull,
  mobility_device: isStringOrNull,
};

function isCachedProfile(value: unknown, userId: string): value is Profile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return (
    profile.id === userId &&
    Object.entries(fieldChecks).every(([field, check]) => check(profile[field]))
  );
}

export async function readCachedProfile(
  userId: string,
): Promise<Profile | null> {
  try {
    const saved = await AsyncStorage.getItem(cacheKey(userId));
    if (!saved) return null;
    const profile: unknown = JSON.parse(saved);
    return isCachedProfile(profile, userId) ? profile : null;
  } catch (cause) {
    console.warn('Unable to read cached profile', cause);
    return null;
  }
}

export async function clearCachedProfile(userId: string) {
  await cacheProfile(userId, null);
}

export async function cacheProfile(userId: string, profile: Profile | null) {
  try {
    if (profile) {
      await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(profile));
    } else {
      await AsyncStorage.removeItem(cacheKey(userId));
    }
  } catch (cause) {
    console.warn('Unable to cache profile', cause);
  }
}
