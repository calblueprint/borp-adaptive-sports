import type { Site } from '@/lib/sites';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import { directionsUrl, parseGeometry } from '@/lib/trailGeometry';
import fillerImage from '~/assets/bp-icon.png';
import AddSiteForm from './AddSiteForm';
import styles from './styles';
import TrailMap from './TrailMap';

type SiteSheetProps = {
  site: Site | null;
  adding: boolean;
  onCreated: (site: Site) => void;
  onClose: () => void;
};

const OPEN_MS = 280;
const CLOSE_MS = 220;

// One native modal lets creation transition directly to the new site's details.
// The backdrop fades while the sheet slides, instead of the whole modal
// (backdrop included) sliding as one hard-edged block.
export default function SiteSheet({
  site,
  adding,
  onCreated,
  onClose,
}: SiteSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [saving, setSaving] = useState(false);
  // True once the add form has anything typed in it
  const [dirty, setDirty] = useState(false);

  const open = adding || site !== null;
  // Stays true until the closing animation finishes
  const [mounted, setMounted] = useState(open);
  // Last thing shown, so the sheet keeps its content while sliding away
  const [lastShown, setLastShown] = useState({ adding, site });
  const shown = open ? { adding, site } : lastShown;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setLastShown({ adding, site });
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Not finished means it was reopened mid-close; stay mounted
        if (finished) setMounted(false);
      });
    }
  }, [open, adding, site, progress]);

  function dismiss() {
    Keyboard.dismiss();
    setDirty(false);
    onClose();
  }

  function close() {
    if (saving) return;
    if (adding && dirty) {
      Alert.alert('Discard this trail?', 'What you’ve entered will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: dismiss },
      ]);
      return;
    }
    dismiss();
  }

  function created(newSite: Site) {
    setDirty(false);
    onCreated(newSite);
  }

  function startSurvey() {
    if (!site) return;
    onClose();
    router.push({
      pathname: '/survey',
      params: { siteId: site.id, siteName: site.name },
    });
  }

  function openDirections() {
    if (!shown.site) return;
    Linking.openURL(directionsUrl(shown.site.lat, shown.site.lng)).catch(() =>
      Alert.alert('Could not open maps', 'Try again in a moment.'),
    );
  }

  const geometry = parseGeometry(shown.site?.geometry ?? null);

  const sheetOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={
            shown.adding ? 'Close add trail' : 'Close trail details'
          }
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            shown.adding && styles.formSheet,
            { paddingBottom: insets.bottom + 16 },
            { transform: [{ translateY: sheetOffset }] },
          ]}
        >
          {shown.adding ? (
            <AddSiteForm
              onClose={close}
              onCreated={created}
              saving={saving}
              onSavingChange={setSaving}
              onDirtyChange={setDirty}
            />
          ) : shown.site ? (
            <>
              {geometry ? (
                <TrailMap geometry={geometry} marker={shown.site} />
              ) : (
                <Image source={fillerImage} style={styles.sheetImage} />
              )}
              <Text style={styles.sheetName} accessibilityRole="header">
                {shown.site.name}
              </Text>
              <Button text="Start survey" onPress={startSurvey} />
              <Button
                text="Get directions"
                variant="secondary"
                onPress={openDirections}
              />
              {shown.site.osm_id !== null && (
                // Required by the OpenStreetMap data license (ODbL)
                <Text style={styles.attribution}>
                  Trail data © OpenStreetMap contributors
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                style={styles.close}
                onPress={close}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
