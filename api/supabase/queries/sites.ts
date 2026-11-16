import type { Site } from '@/lib/sites';
import supabase from '../client';

export async function fetchSites(): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, lat, lng');
  if (error) throw error;
  return data ?? [];
}
