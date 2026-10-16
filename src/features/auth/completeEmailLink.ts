import supabase from '~/api/supabase/client';

export async function completeEmailLink(url: string) {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash.slice(1));
  parsed.searchParams.forEach((value, key) => params.set(key, value));
  if (params.has('error') || params.has('error_code'))
    throw new Error(
      'This email link is invalid or expired. Request a new link.',
    );
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : accessToken && refreshToken
      ? await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      : null;
  if (!result)
    throw new Error(
      'This link has no verification details. Request a new email link.',
    );
  if (result.error) throw result.error;
  if (!result.data.session?.user.email_confirmed_at)
    throw new Error(
      'Your email has not been verified. Request a new email link.',
    );
}
