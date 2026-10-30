import type { SupabaseClient } from '@supabase/supabase-js';
import supabase from '../client';

function normalizeEmail(email: string): string {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error('Enter a valid email address.');
  }
  return address;
}

async function accountEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('account_email_exists', {
    email_to_check: email,
  });
  // Fail closed: don't send auth emails when the lookup fails or is unavailable.
  if (error || typeof data !== 'boolean') {
    throw new Error(
      'Unable to check this email right now. Please try again later.',
    );
  }
  return data;
}

export async function requestSignupCode(email: string): Promise<string> {
  const address = normalizeEmail(email);
  if (await accountEmailExists(address)) {
    throw new Error(
      'An account already uses this email. Log in or reset your password.',
    );
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: address,
    options: {
      shouldCreateUser: true,
      data: { password_setup_required: true },
    },
  });
  if (error) throw error;
  return address;
}

export async function requestPasswordRecoveryCode(
  email: string,
  recoveryClient: SupabaseClient,
): Promise<string> {
  const address = normalizeEmail(email);
  if (!(await accountEmailExists(address))) {
    throw new Error(
      'No account uses this email. Check the address or create an account.',
    );
  }
  const { error } = await recoveryClient.auth.resetPasswordForEmail(address);
  if (error) throw error;
  return address;
}
