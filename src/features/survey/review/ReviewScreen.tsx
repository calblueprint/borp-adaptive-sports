import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import TextLink from '@/components/TextLink/TextLink';
import { toRow } from '@/lib/survey';
import colors from '@/styles/colors';
import { uploadSurveyPhotos } from '~/api/supabase/queries/photos';
import {
  getSurveyItems,
  submitSurvey,
  SurveyItem,
} from '~/api/supabase/queries/surveys';
import PinRow from '../PinRow/PinRow';
import { useSurvey } from '../SurveyProvider';
import styles from './styles';

export default function ReviewScreen() {
  const router = useRouter();
  const { answers, photos, surveyId, siteName } = useSurvey();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<SurveyItem[] | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!surveyId) return;
    let active = true;
    getSurveyItems(surveyId)
      .then(found => active && setItems(found))
      .catch(
        (e: unknown) =>
          active &&
          setLoadError(e instanceof Error ? e.message : 'Could not load pins.'),
      );
    return () => {
      active = false;
    };
  }, [surveyId]);

  const handleSend = async () => {
    if (!surveyId) return;
    setSending(true);
    setMessage('');
    try {
      await submitSurvey(toRow(answers), surveyId);

      const allPhotos = Object.values(photos).flat();
      if (allPhotos.length > 0) {
        const failed = await uploadSurveyPhotos(surveyId, allPhotos);
        if (failed > 0)
          Alert.alert(
            'Survey sent',
            `${failed} of ${allPhotos.length} photos couldn’t be uploaded.`,
          );
      }
      // Clear the form/session/review history so back can't return to a
      // survey that's already been sent
      router.dismissAll();
      router.replace('/survey/sent');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not send survey.');
      setSending(false);
    }
  };

  // Only reachable through a bad link; review always comes after a session
  if (!surveyId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <BackButton style={styles.backButton} />
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

  const pinSummary =
    items === null
      ? ' '
      : `${items.length} ${items.length === 1 ? 'pin' : 'pins'}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton style={styles.backButton} />

        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">
            {siteName ?? 'Trail survey'}
          </Text>
          <Text style={styles.subtitle}>{pinSummary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Pins
          </Text>
          {loadError !== '' ? (
            <Text style={styles.message}>{loadError}</Text>
          ) : items === null ? (
            <ActivityIndicator
              style={styles.loading}
              accessibilityLabel="Loading pins"
            />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>No pins from this session.</Text>
          ) : (
            items.map((item, i) => (
              <PinRow key={item.id} item={item} number={i + 1} />
            ))
          )}
        </View>

        <TextLink
          text="Edit pre-survey answers"
          onPress={() => router.dismissAll()}
          disabled={sending}
        />
      </ScrollView>

      <View style={styles.footer}>
        {message !== '' && <Text style={styles.message}>{message}</Text>}
        <Button
          text={sending ? 'Sending…' : 'Send to BORP'}
          icon={sending && <ActivityIndicator color={colors.white} />}
          onPress={() => void handleSend()}
          disabled={sending || items === null}
        />
      </View>
    </SafeAreaView>
  );
}
