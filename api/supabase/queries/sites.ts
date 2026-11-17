import type { CreateSiteInput } from '@/lib/siteForm';
import type { Site } from '@/lib/sites';
import supabase from '../client';

export async function fetchSites(): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, lat, lng');
  if (error) throw error;
  return data ?? [];
}

export async function createSite(
  input: CreateSiteInput,
  userId: string,
): Promise<Site> {
  if (!userId) throw new Error('Please sign in before adding a trail.');

  const { data, error } = await supabase
    .from('sites')
    .insert({ ...input, created_by: userId })
    .select('id, name, lat, lng')
    .single();

  if (error?.code === '42501')
    throw new Error('Your account does not have permission to add trails.');
  if (error || !data)
    throw new Error(
      'Could not add this trail. Check your connection and try again.',
    );
  return data;
}
