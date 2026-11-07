import supabase from '../client';

// Example query to fetch all rows from your_table_name
// REPLACE LATER
export async function fetchAllRows() {
  const { data, error } = await supabase.from('your_table_name').select('*');

  if (error) {
    throw new Error(`Error fetching data: ${error.message}`);
  }

  return data;
}

// const TEST_USER_ID = 'ab304b15-8207-48e1-bd31-a9cc725bcf5e';
const TEST_SITE_ID = '0640cbbe-a919-442c-875d-b48dbd27eba1';

export async function saveDraftSurvey(
  row: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const { data: latest, error: versionError } = await supabase
    .from('surveys')
    .select('version')
    .eq('site_id', TEST_SITE_ID)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError)
    throw new Error(`Error finding version: ${versionError.message}`);

  const now = new Date().toISOString();
  const { error } = await supabase.from('surveys').insert({
    ...row,
    site_id: TEST_SITE_ID,
    surveyor_id: userId,
    status: 'draft',
    version: (latest?.version ?? 0) + 1,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Error saving draft: ${error.message}`);
}
