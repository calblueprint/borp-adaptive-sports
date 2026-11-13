import type { Tables } from '../database.types';
import supabase from '../client';
import { readAll } from './readAll';

export type Site = Tables<'sites'>;
export type SurveyPerson = Pick<Tables<'profiles'>, 'id' | 'name' | 'email'>;
export type AdminSurvey = Tables<'surveys'> & {
  surveyor: SurveyPerson | null;
  reviewer: SurveyPerson | null;
};
export type SurveyDetails = {
  survey: AdminSurvey;
  site: Site;
  items: Tables<'survey_items'>[];
  photos: Tables<'photos'>[];
  trails: Tables<'trail_sessions'>[];
};

export function fetchAdminSites(): Promise<Site[]> {
  return readAll((from, to) =>
    supabase
      .from('sites')
      .select('*')
      .order('name')
      .order('id')
      .range(from, to),
  );
}

const surveySelect =
  '*, surveyor:profiles!surveys_surveyor_id_fkey(id, name, email), reviewer:profiles!surveys_reviewer_id_fkey(id, name, email)';

export async function fetchSiteSurveys(siteId: string) {
  const [siteResult, surveys] = await Promise.all([
    supabase.from('sites').select('*').eq('id', siteId).maybeSingle(),
    readAll<AdminSurvey>((from, to) =>
      supabase
        .from('surveys')
        .select(surveySelect)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, to),
    ),
  ]);
  if (siteResult.error) throw new Error(siteResult.error.message);
  if (!siteResult.data) throw new Error('This site could not be found.');
  return { site: siteResult.data, surveys };
}

export async function fetchSurveyDetails(id: string): Promise<SurveyDetails> {
  const { data: survey, error } = await supabase
    .from('surveys')
    .select(surveySelect)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!survey) throw new Error('This survey could not be found.');

  const [siteResult, items, photos, trails] = await Promise.all([
    supabase.from('sites').select('*').eq('id', survey.site_id).maybeSingle(),
    readAll((from, to) =>
      supabase
        .from('survey_items')
        .select('*')
        .eq('survey_id', id)
        .order('item_order')
        .order('id')
        .range(from, to),
    ),
    readAll((from, to) =>
      supabase
        .from('photos')
        .select('*')
        .eq('survey_id', id)
        .order('created_at')
        .order('id')
        .range(from, to),
    ),
    readAll((from, to) =>
      supabase
        .from('trail_sessions')
        .select('*')
        .eq('survey_id', id)
        .order('recorded_at', { ascending: false })
        .order('id')
        .range(from, to),
    ),
  ]);
  if (siteResult.error) throw new Error(siteResult.error.message);
  if (!siteResult.data)
    throw new Error('The survey’s site could not be found.');
  return { survey, site: siteResult.data, items, photos, trails };
}

export async function signAdminFile(
  bucket: 'photos' | 'trail-tracks',
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
