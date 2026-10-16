import supabase from '../client';

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'surveyor' | 'admin';
  affiliation: string | null;
  mobility_device: string | null;
};

export type ProfileDetails = Pick<
  Profile,
  'name' | 'affiliation' | 'mobility_device'
>;

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email,role,affiliation,mobility_device')
    .eq('id', userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return data;
}

export async function createProfile(details: ProfileDetails): Promise<Profile> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user?.email || !user.email_confirmed_at)
    throw new Error('Verify your email before creating a profile.');
  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...details, id: user.id, email: user.email, role: 'surveyor' })
    .select('id,name,email,role,affiliation,mobility_device')
    .single<Profile>();
  if (error) throw error;
  return data;
}
