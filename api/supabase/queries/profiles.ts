import type { Profile, ProfileDetails } from '@/lib/profiles';
import type { User } from '@supabase/supabase-js';
import supabase from '../client';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, name, email, role, phone_number, affiliation, mobility_device, created_at',
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(user: User, details: ProfileDetails) {
  if (!user.email) throw new Error('Cannot create a profile without an email.');
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
