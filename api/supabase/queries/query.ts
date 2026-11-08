import supabase from '../client';

const TEST_SITE_ID = '0640cbbe-a919-442c-875d-b48dbd27eba1';

// TODO: need to address duplicate survey error, will use updated_at column for that
export async function saveDraftSurvey(
  row: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('surveys').insert({
    ...row,
    site_id: TEST_SITE_ID,
    surveyor_id: userId,
    status: 'draft',
    version: 0,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Error saving draft: ${error.message}`);
}
