import type { LocalPhoto } from '@/lib/photos';
import supabase from '../client';

async function uploadPhoto(surveyId: string, photo: LocalPhoto, i: number) {
  const ext = photo.mimeType.split('/')[1] ?? 'jpg';

  // TODO: for path, maybe we can be more descriptive? cover photo for example? or separating sections?
  const path = `${surveyId}/${Date.now()}-${i}.${ext}`;
  const body = await (await fetch(photo.uri)).arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, body, { contentType: photo.mimeType });
  if (uploadError) throw uploadError;

  // TODO: set survey_item_id once photos are tied to individual questions
  const { error: insertError } = await supabase
    .from('photos')
    .insert({ survey_id: surveyId, storage_path: path, uploaded: true });
  if (insertError) throw insertError;
}

export async function uploadSurveyPhotos(
  surveyId: string,
  photos: LocalPhoto[],
): Promise<number> {
  const results = await Promise.allSettled(
    photos.map((photo, i) => uploadPhoto(surveyId, photo, i)),
  );
  return results.filter(r => r.status === 'rejected').length;
}
