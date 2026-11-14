import type { Profile } from '~/api/supabase/queries/profiles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheKey = (userId: string) => `borp:profile:v1:${userId}`;

function isCachedProfile(value: unknown, userId: string): value is Profile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return (
    profile.id === userId &&
    typeof profile.name === 'string' &&
    typeof profile.email === 'string' &&
    (profile.role === 'surveyor' || profile.role === 'admin') &&
    [profile.phone_number, profile.affiliation, profile.mobility_device].every(
      field => field === null || typeof field === 'string',
    )
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
