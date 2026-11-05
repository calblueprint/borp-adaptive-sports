import type { User } from '@supabase/supabase-js';
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

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, phone_number, affiliation, mobility_device')
    .eq('id', userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return data;
}

export async function createProfile(user: User, details: ProfileDetails) {
  const { error } = await supabase
    .from('profiles')
    .insert({ ...details, id: user.id, email: user.email, role: 'surveyor' });
  if (error) throw error;
}

export async function updateProfile(userId: string, details: ProfileDetails) {
  const { error } = await supabase
    .from('profiles')
    .update(details)
    .eq('id', userId)
    .select('id')
    .single();
  if (error) throw error;
}
