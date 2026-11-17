import type { LocalPhoto } from '@/lib/photos';
import supabase from '../client';

async function uploadPhoto(
  surveyId: string,
  photo: LocalPhoto,
  i: number,
  surveyItemId: string | null,
) {
  const ext = photo.mimeType.split('/')[1] ?? 'jpg';

  // TODO: for path, maybe we can be more descriptive? cover photo for example? or separating sections?
  const path = `${surveyId}/${Date.now()}-${i}.${ext}`;
  const body = await (await fetch(photo.uri)).arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, body, { contentType: photo.mimeType });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('photos').insert({
    survey_id: surveyId,
    survey_item_id: surveyItemId,
    storage_path: path,
    uploaded: true,
  });
  if (insertError) throw insertError;
}

// Uploads photos for a survey, tied to one pin when surveyItemId is given.
// Returns how many failed.
export async function uploadSurveyPhotos(
  surveyId: string,
  photos: LocalPhoto[],
  surveyItemId: string | null = null,
): Promise<number> {
  const results = await Promise.allSettled(
    photos.map((photo, i) => uploadPhoto(surveyId, photo, i, surveyItemId)),
  );
  return results.filter(r => r.status === 'rejected').length;
}
