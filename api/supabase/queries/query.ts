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

const TEST_USER_ID = 'ab304b15-8207-48e1-bd31-a9cc725bcf5e';
const TEST_SITE_ID = '45b8274f-04e0-413b-8a04-9ff9b2a4eb4f';

export async function saveDraftSurvey(
  row: Record<string, unknown>,
  surveyId?: string,
): Promise<string> {
  const now = new Date().toISOString();

  if (surveyId) {
    const { data, error } = await supabase
      .from('surveys')
      .update({ ...row, updated_at: now })
      .eq('id', surveyId)
      .select('id');
    if (error) throw new Error(`Error saving draft: ${error.message}`);
    if (!data?.length) {
      throw new Error('Draft was not updated. Check permissions.');
    }
    return surveyId;
  }

  const { data, error } = await supabase
    .from('surveys')
    .insert({
      ...row,
      site_id: TEST_SITE_ID,
      surveyor_id: TEST_USER_ID,
      status: 'draft',
      version: 1,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Error saving draft: ${error.message}`);
  return data.id;
}
