import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { clearCachedProfile } from '@/features/profile/profileCache';
import supabase from '~/api/supabase/client';

export function useSignOut() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      if (session) await clearCachedProfile(session.user.id);
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (signOutError) throw signOutError;
    } catch {
      setError('Unable to log out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return { signOut, busy, error };
}
