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

const TEST_USER_ID = '8ded2c71-1207-453f-aed7-89498e1fc0b3';
const TEST_SITE_ID = '0fdd1aa1-c783-4ea3-af8f-f9dcb70b5aa1';

export async function saveDraftSurvey(
  row: Record<string, unknown>,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('surveys').insert({
    ...row,
    site_id: TEST_SITE_ID,
    surveyor_id: TEST_USER_ID,
    status: 'draft',
    version: 1,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Error saving draft: ${error.message}`);
}
