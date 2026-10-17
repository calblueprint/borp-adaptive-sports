import { Alert, Button, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import supabase from '~/api/supabase/client';

const TEST_SURVEY_ID = '0d663bf2-d06b-41e5-8204-cf1b58488c68';

async function uploadFile(uri: string, mimeType: string) {
  const ext = uri.split('.').pop();
  const path = `${TEST_SURVEY_ID}/${Date.now()}.${ext}`;

  const body = await (await fetch(uri)).arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, body, { contentType: mimeType });
  if (uploadError) return Alert.alert('Upload failed', uploadError.message);

  const { error: insertError } = await supabase
    .from('photos')
    .insert({ survey_id: TEST_SURVEY_ID, storage_path: path, uploaded: true });
  if (insertError) return Alert.alert('Insert failed', insertError.message);
}

async function pickPhoto() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return Alert.alert('Library permission denied');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
  });
  if (!result.canceled) {
    const asset = result.assets[0];
    await uploadFile(asset.uri, asset.mimeType ?? 'image/jpeg');
  }
}

async function takePhoto() {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return Alert.alert('Camera permission denied');
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
  });
  if (!result.canceled) {
    const asset = result.assets[0];
    await uploadFile(asset.uri, asset.mimeType ?? 'image/jpeg');
  }
}

export default function PhotoTest() {
  return (
    <View>
      <Button title="Take photo" onPress={takePhoto} />
      <Button title="Choose from library" onPress={pickPhoto} />
    </View>
  );
}
