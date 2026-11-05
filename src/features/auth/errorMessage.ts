import { isAuthRetryableFetchError } from '@supabase/supabase-js';

export function errorMessage(cause: unknown, fallback: string): string {
  if (isAuthRetryableFetchError(cause))
    return 'Unable to connect. Check your connection and try again.';
  return cause instanceof Error ? cause.message : fallback;
}
