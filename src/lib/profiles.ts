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
  | 'created_at'
>;

// The fields a user fills in on the profile form
export type ProfileDetails = Pick<
  Profile,
  'name' | 'phone_number' | 'affiliation' | 'mobility_device'
>;

// Choices for profiles.mobility_device, shared by profile setup and
// "How you go on trails" so both store the same values
export const MOBILITY_OPTIONS = [
  'Walking',
  'Bike',
  'Scooter',
  'Manual chair',
  'Power chair',
  'Walker',
  'Cane or crutches',
];
