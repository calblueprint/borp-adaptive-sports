import type { SurveyAnswersRow } from '@/lib/survey';
import supabase from '../client';

// Creates the survey as a draft once the pre-survey is finished and
// returns its id, so pins (survey_items) can link to it
export async function saveDraftSurvey(
  row: SurveyAnswersRow,
  userId: string,
  siteId: string,
): Promise<string> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      ...row,
      site_id: siteId,
      surveyor_id: userId,
      status: 'draft',
      version: 0,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Error saving draft: ${error.message}`);
  return data.id;
}

// TODO: need to address duplicate survey error, will use updated_at column for that
// finalizes the existing draft instead of inserting a second row
export async function submitSurvey(
  row: SurveyAnswersRow,
  surveyId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('surveys')
    .update({
      ...row,
      status: 'submitted',
      updated_at: now,
      submitted_at: now,
    })
    .eq('id', surveyId)
    .select('id')
    .single();
  if (error) throw new Error(`Error submitting survey: ${error.message}`);
}

// hardcoded until GPS is integrated
const PLACEHOLDER_LAT = 37.8719;
const PLACEHOLDER_LNG = -122.2585;

export async function addSurveyItem(
  surveyId: string,
  type: string,
  notes: string,
): Promise<void> {
  const { data: latest, error: orderError } = await supabase
    .from('survey_items')
    .select('item_order')
    .eq('survey_id', surveyId)
    .order('item_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) {
    throw new Error(`Error finding pin order: ${orderError.message}`);
  }

  const { error } = await supabase.from('survey_items').insert({
    survey_id: surveyId,
    type,
    item_order: (latest?.item_order ?? -1) + 1,
    lat: PLACEHOLDER_LAT,
    lng: PLACEHOLDER_LNG,
    notes,
  });
  if (error) throw new Error(`Error saving pin: ${error.message}`);
}
