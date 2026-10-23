import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import supabase, { readSavedSession } from '~/api/supabase/client';

const AuthContext = createContext<{
  session: Session | null;
  isLoading: boolean;
  error: string | null;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let authChanged = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return;
      authChanged = true;
      if (active) {
        setSession(nextSession);
        setError(null);
        setIsLoading(false);
      }
    });

    async function restoreSession() {
      try {
        const savedSession = await readSavedSession();
        if (active && !authChanged) {
          setSession(savedSession);
          setIsLoading(false);
        }
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!active || authChanged) return;
        if (sessionError && isAuthRetryableFetchError(sessionError)) return;
        setSession(data.session);
        if (sessionError) setError(sessionError.message);
      } catch {
        if (active)
          setError('Unable to restore your session. Please restart the app.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void restoreSession();

    function updateRefresh(state: string) {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    }
    if (Platform.OS !== 'web') updateRefresh(AppState.currentState);
    const listener =
      Platform.OS !== 'web'
        ? AppState.addEventListener('change', updateRefresh)
        : null;

    return () => {
      active = false;
      subscription.unsubscribe();
      listener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
