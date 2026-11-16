import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';

export type ScreenGroup = 'auth' | 'status' | 'setup' | 'main';

export function useScreenGroup(): ScreenGroup {
  const { session } = useAuth();
  const { profile, isLoading, error } = useProfile();

  // Not logged in, or email not verified yet
  if (!session?.user.email_confirmed_at) return 'auth';

  // Profile still loading, or failed to load
  if (isLoading || error) return 'status';

  // Still needs to set a password or finish their profile
  const needsPassword =
    session.user.user_metadata.password_setup_required === true;
  const hasCompleteProfile =
    !!profile?.name?.trim() && !!profile?.phone_number?.trim();
  if (needsPassword || !hasCompleteProfile) return 'setup';

  return 'main';
}
