import type { Tables } from '~/api/supabase/database.types';

export type Profile = Pick<
  Tables<'profiles'>,
  | 'id'
  | 'name'
  | 'email'
  | 'role'
  | 'phone_number'
  | 'affiliation'
  | 'mobility_device'
>;

// The fields a user fills in on the profile form
export type ProfileDetails = Pick<
  Profile,
  'name' | 'phone_number' | 'affiliation' | 'mobility_device'
>;
