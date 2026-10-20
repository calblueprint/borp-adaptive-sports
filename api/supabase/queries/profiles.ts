import supabase from '../client';

export type Profile = {
  id: string;
  name: string;
  phone_number: string | null;
  email: string;
  role: 'surveyor' | 'admin';
  affiliation: string | null;
  mobility_device: string | null;
};

export type ProfileDetails = Pick<
  Profile,
  'name' | 'phone_number' | 'affiliation' | 'mobility_device'
>;

export function profileErrorMessage(error: unknown): string {
  const failure = error as { code?: string; message?: string } | null;
  if (failure?.code === '42501')
    return 'Profile access is not configured in Supabase. Apply the profile policies migration, then retry. (42501)';
  if (failure?.code === 'PGRST205' || failure?.code === '42P01')
    return 'The profiles table is unavailable in Supabase. Check the table and Data API schema configuration, then retry.';
  if (failure?.code === 'PGRST204' || failure?.code === '42703')
    return 'The profiles table columns do not match the app. Apply the latest profile migrations in Supabase.';
  if (failure?.code === 'PGRST301' || failure?.code === 'PGRST303')
    return 'Your session has expired. Log out and log in again.';
  return failure?.message
    ? `Unable to load or save your profile: ${failure.message}`
    : 'Unable to connect to Supabase. Check your connection and retry.';
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email,role,phone_number,affiliation,mobility_device')
    .eq('id', userId)
    .limit(1)
    .returns<Profile[]>();
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function createProfile(details: ProfileDetails): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user?.email || !user.email_confirmed_at)
    throw new Error('Verify your email before creating a profile.');
  const { error } = await supabase.from('profiles').insert({
    ...details,
    id: user.id,
    email: user.email,
    role: 'surveyor',
  });
  if (error) throw error;
}
