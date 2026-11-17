import type { SurveyAnswersRow } from '@/lib/survey';
import supabase from '../client';

// Creates the survey as a draft once the pre-survey is finished and
// returns its id, so session items (survey_items) can link to it
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

// The user's most recent unsent draft for this site, if any, so an
// abandoned session can be picked back up instead of starting a new row
export async function findDraftSurvey(
  userId: string,
  siteId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('surveys')
    .select('id')
    .eq('surveyor_id', userId)
    .eq('site_id', siteId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Error finding draft: ${error.message}`);
  return data?.id ?? null;
}

// finalizes the existing draft instead of inserting a second row.
// Only matches drafts, so an already-sent survey can't be overwritten.
export async function submitSurvey(
  row: SurveyAnswersRow,
  surveyId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('surveys')
    .update({
      ...row,
      status: 'submitted',
      updated_at: now,
      submitted_at: now,
    })
    .eq('id', surveyId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Error submitting survey: ${error.message}`);
  // No row means it was already sent (or RLS blocked the update)
  if (!data) {
    throw new Error("This survey couldn't be sent. It may already be sent.");
  }
}

export type SurveyItem = {
  id: string;
  type: string;
  notes: string | null;
  item_order: number;
};

export async function getSurveyItems(surveyId: string): Promise<SurveyItem[]> {
  const { data, error } = await supabase
    .from('survey_items')
    .select('id, type, notes, item_order')
    .eq('survey_id', surveyId)
    .order('item_order', { ascending: true });
  if (error) throw new Error(`Error loading pins: ${error.message}`);
  return data;
}

// hardcoded until GPS is integrated
const PLACEHOLDER_LAT = 37.8719;
const PLACEHOLDER_LNG = -122.2585;

export async function addSurveyItem(
  surveyId: string,
  type: string,
  notes: string,
): Promise<SurveyItem> {
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

  const { data, error } = await supabase
    .from('survey_items')
    .insert({
      survey_id: surveyId,
      type,
      item_order: (latest?.item_order ?? -1) + 1,
      lat: PLACEHOLDER_LAT,
      lng: PLACEHOLDER_LNG,
      notes: notes.trim() || null,
    })
    .select('id, type, notes, item_order')
    .single();
  if (error) throw new Error(`Error saving pin: ${error.message}`);
  return data;
}
