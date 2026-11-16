import type { Site } from '@/lib/sites';
import { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import fillerImage from '~/assets/bp-icon.png';
import AddSiteForm from './AddSiteForm';
import styles from './styles';

type SiteSheetProps = {
  site: Site | null;
  adding: boolean;
  onCreated: (site: Site) => void;
  onClose: () => void;
};

// One native modal lets creation transition directly to the new site's details.
export default function SiteSheet({
  site,
  adding,
  onCreated,
  onClose,
}: SiteSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  function close() {
    if (!saving) {
      Keyboard.dismiss();
      onClose();
    }
  }

  function startSurvey() {
    if (!site) return;
    onClose();
    router.push({
      pathname: '/survey',
      params: { siteId: site.id, siteName: site.name },
    });
  }

  return (
    <Modal
      visible={adding || site !== null}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={
            adding ? 'Close add trail' : 'Close trail details'
          }
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            adding && styles.formSheet,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          {adding ? (
            <AddSiteForm
              onClose={close}
              onCreated={onCreated}
              saving={saving}
              onSavingChange={setSaving}
            />
          ) : site ? (
            <>
              <Image source={fillerImage} style={styles.sheetImage} />
              <Text style={styles.sheetName} accessibilityRole="header">
                {site.name}
              </Text>
              <Button text="Start survey" onPress={startSurvey} />
              <Pressable
                accessibilityRole="button"
                style={styles.close}
                onPress={close}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
