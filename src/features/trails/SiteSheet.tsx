import type { Site } from '@/lib/sites';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import fillerImage from '~/assets/bp-icon.png';
import styles from './styles';

type SiteSheetProps = {
  site: Site | null;
  onClose: () => void;
};

// Bottom sheet for the selected site. Visible whenever `site` is set.
export default function SiteSheet({ site, onClose }: SiteSheetProps) {
  const router = useRouter();

  function startSurvey() {
    if (!site) return;
    onClose();
    router.push({ pathname: '/survey', params: { siteId: site.id } });
  }

  return (
    <Modal
      visible={site !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {site && (
          <View style={styles.sheet}>
            <Image source={fillerImage} style={styles.sheetImage} />
            <Text style={styles.sheetName}>{site.name}</Text>
            <Button text="Start survey" onPress={startSurvey} />
            <Pressable
              accessibilityRole="button"
              style={styles.close}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
