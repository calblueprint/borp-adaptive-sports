import type { LocalPhoto } from '@/lib/photos';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import { PIN_TYPES, pinTypeLabel } from '@/lib/survey';
import colors from '@/styles/colors';
import { uploadSurveyPhotos } from '~/api/supabase/queries/photos';
import {
  addSurveyItem,
  getSurveyItems,
  SurveyItem,
} from '~/api/supabase/queries/surveys';
import PinRow from '../PinRow/PinRow';
import { useSurvey } from '../SurveyProvider';
import styles from './styles';

export default function SessionScreen() {
  const router = useRouter();
  const { surveyId } = useSurvey();
  const [type, setType] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [items, setItems] = useState<SurveyItem[] | null>(null);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // A resumed draft may already have pins
  useEffect(() => {
    if (!surveyId) return;
    let active = true;
    getSurveyItems(surveyId)
      .then(found => active && setItems(found))
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [surveyId]);

  const pinNumber = (items?.length ?? 0) + 1;

  const handleAddItem = async () => {
    if (!surveyId || !type) return;
    setAdding(true);
    setMessage('');
    setError('');
    try {
      const item = await addSurveyItem(surveyId, type, notes);
      setItems(prev => [...(prev ?? []), item]);

      let photoNote = '';
      if (photos.length > 0) {
        const failed = await uploadSurveyPhotos(surveyId, photos, item.id);
        const uploaded = photos.length - failed;
        setPhotoCounts(prev => ({ ...prev, [item.id]: uploaded }));
        photoNote =
          failed > 0
            ? ` ${failed} of ${photos.length} photos couldn’t be uploaded.`
            : ` with ${uploaded} ${uploaded === 1 ? 'photo' : 'photos'}`;
      }

      setMessage(`Pin ${pinNumber} saved: ${pinTypeLabel(type)}${photoNote}`);
      setType(null);
      setNotes('');
      setPhotos([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save pin.');
    } finally {
      setAdding(false);
    }
  };

  // Only reachable through a bad link; a session always starts from the form
  if (!surveyId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <BackButton />
          <Text style={styles.title} accessibilityRole="header">
            No session in progress
          </Text>
          <Link href="/trails" replace>
            Choose a site
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton />

        <View style={styles.heading}>
          <Text style={styles.subtitle}>Trail session</Text>
          <Text style={styles.title} accessibilityRole="header">
            What’s here?
          </Text>
          <Text style={styles.subtitle}>Pin {pinNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Type
          </Text>
          <View style={styles.chips}>
            {PIN_TYPES.map(t => {
              const selected = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: adding }}
                  disabled={adding}
                  onPress={() => setType(t.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Notes
          </Text>
          <TextInput
            style={styles.notes}
            placeholder="Optional"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            editable={!adding}
            multiline
            accessibilityLabel="Notes, optional"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Photos
          </Text>
          <PhotoPicker photos={photos} onChange={setPhotos} disabled={adding} />
        </View>

        <View style={styles.addPin}>
          <Button
            text={adding ? 'Saving pin…' : 'Add pin'}
            icon={adding && <ActivityIndicator color={colors.white} />}
            onPress={() => void handleAddItem()}
            disabled={adding || !type}
          />
          {message !== '' && (
            <Text style={styles.success} accessibilityLiveRegion="polite">
              {message}
            </Text>
          )}
          {error !== '' && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Pins this session
          </Text>
          {items === null ? (
            <ActivityIndicator
              style={styles.loading}
              accessibilityLabel="Loading pins"
            />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>No pins yet.</Text>
          ) : (
            items.map((item, i) => (
              <PinRow
                key={item.id}
                item={item}
                number={i + 1}
                photoCount={photoCounts[item.id]}
              />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          text="Finish"
          variant="secondary"
          onPress={() => router.push('/survey/review')}
          disabled={adding}
          style={styles.finishButton}
        />
      </View>
    </SafeAreaView>
  );
}
