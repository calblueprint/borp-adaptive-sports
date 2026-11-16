import type { SurveyAnswersRow } from '@/lib/survey';
import supabase from '../client';

// TODO: not used yet. Call this to save a draft before the survey is submitted.
export async function saveDraftSurvey(
  row: SurveyAnswersRow,
  userId: string,
  siteId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('surveys').insert({
    ...row,
    site_id: siteId,
    surveyor_id: userId,
    status: 'draft',
    version: 0,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Error saving draft: ${error.message}`);
}

// TODO: need to address duplicate survey error, will use updated_at column for that
export async function submitSurvey(
  row: SurveyAnswersRow,
  userId: string,
  siteId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('surveys').insert({
    ...row,
    site_id: siteId,
    surveyor_id: userId,
    status: 'submitted',
    version: 0,
    created_at: now,
    updated_at: now,
    submitted_at: now,
  });
  if (error) throw new Error(`Error submitting survey: ${error.message}`);
}
