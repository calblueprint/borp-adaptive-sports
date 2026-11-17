import type { LocalPhoto } from '@/lib/photos';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CameraLarge from '@/icons/camera-large.svg';
import ImageIcon from '@/icons/image.svg';
import XBadge from '@/icons/x-badge.svg';
import styles from './styles';

// Smaller uploads in the field with no visible difference on a phone screen
const PHOTO_QUALITY = 0.7;

type PhotoPickerProps = {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  disabled?: boolean;
};

function toLocalPhotos(result: ImagePicker.ImagePickerResult): LocalPhoto[] {
  if (result.canceled) return [];
  return result.assets.map(asset => ({
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  }));
}

// Take a photo or pick from the library, with removable thumbnails.
// Photos stay on the phone; the caller decides when to upload them.
function PhotoPicker({ photos, onChange, disabled = false }: PhotoPickerProps) {
  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted)
      return Alert.alert(
        'Camera access needed',
        'Allow camera access in Settings to take photos.',
      );
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: PHOTO_QUALITY,
    });
    onChange([...photos, ...toLocalPhotos(result)]);
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert(
        'Photo access needed',
        'Allow photo access in Settings to choose photos.',
      );
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: PHOTO_QUALITY,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    onChange([...photos, ...toLocalPhotos(result)]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tiles}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => void takePhoto()}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <CameraLarge width={26} height={26} />
          <Text style={styles.tileLabel}>Take photo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => void pickFromLibrary()}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <ImageIcon width={26} height={26} />
          <Text style={styles.tileLabel}>Library</Text>
        </Pressable>
      </View>

      {photos.length > 0 && (
        <View style={styles.thumbs}>
          {photos.map((photo, i) => (
            <View key={photo.uri} style={styles.thumb}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.thumbImage}
                accessibilityLabel={`Photo ${i + 1}`}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                disabled={disabled}
                hitSlop={12}
                onPress={() => onChange(photos.filter((_, j) => j !== i))}
                style={styles.remove}
              >
                <XBadge width={12} height={12} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default PhotoPicker;
