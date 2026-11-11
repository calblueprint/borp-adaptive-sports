import type { Profile } from '~/api/supabase/queries/profiles';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchProfile } from '~/api/supabase/queries/profiles';
import { cacheProfile, readCachedProfile } from './profileCache';

type ProfileState = {
  userId: string;
  profile: Profile | null;
  error: string | null;
};
const ProfileContext = createContext<{
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.email_confirmed_at ? session.user.id : undefined;
  const [state, setState] = useState<ProfileState | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => {
    setState(null);
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setState(null);
    async function loadProfile(id: string) {
      const cached = await readCachedProfile(id);
      if (!active) return;
      if (cached) setState({ userId: id, profile: cached, error: null });
      try {
        const profile = await fetchProfile(id);
        if (!active) return;
        setState({ userId: id, profile, error: null });
        await cacheProfile(id, profile);
      } catch (cause) {
        console.error('Failed to load profile', cause);
        if (active && !cached)
          setState({
            userId: id,
            profile: null,
            error:
              'Unable to load your profile. Check your connection and try again.',
          });
      }
    }
    if (userId) void loadProfile(userId);
    return () => {
      active = false;
    };
  }, [userId, version]);

  const current = state?.userId === userId ? state : null;
  return (
    <ProfileContext.Provider
      value={{
        profile: current?.profile ?? null,
        isLoading: !!userId && !current,
        error: current?.error ?? null,
        reload,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error('useProfile must be used inside ProfileProvider.');
  return context;
}
