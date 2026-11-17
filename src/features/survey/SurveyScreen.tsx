import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import Question from '@/components/Question/Question';
import { useAuth } from '@/features/auth/AuthProvider';
import Camera from '@/icons/camera.svg';
import {
  AnswerValue,
  Question as QuestionData,
  questionList,
  toRow,
  validateAll,
  validateAnswer,
} from '@/lib/survey';
import {
  findDraftSurvey,
  saveDraftSurvey,
} from '~/api/supabase/queries/surveys';
import styles from './styles';
import { useSurvey } from './SurveyProvider';

const sections = questionList.reduce<Record<string, QuestionData[]>>(
  (groups, q) => {
    (groups[q.section] ??= []).push(q);
    return groups;
  },
  {},
);

export default function SurveyScreen() {
  const { session } = useAuth();
  const { siteId, siteName } = useLocalSearchParams<{
    siteId?: string;
    siteName?: string;
  }>();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const { answers, setAnswers, photos, setPhotos, surveyId, startSession } =
    useSurvey();
  const starting = useRef(false);
  const [openPhotos, setOpenPhotos] = useState<Record<string, boolean>>({});

  const setAnswer = (q: QuestionData, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [q.column]: value }));
    const error = validateAnswer(q, value);
    setErrors(prev => {
      const next = { ...prev };
      if (error) next[q.column] = error;
      else delete next[q.column];
      return next;
    });
  };

  const handleStart = async () => {
    const found = validateAll(answers);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage('Fix the highlighted answers first.');
      return;
    }
    if (!siteId) return;
    if (!session) {
      setMessage('Please log in first.');
      return;
    }
    if (starting.current) return;
    starting.current = true;
    setMessage('');
    setSaving(true);

    try {
      if (!surveyId) {
        // Pick up an unfinished draft for this site instead of making another
        const draftId = await findDraftSurvey(session.user.id, siteId);
        startSession(
          draftId ??
            (await saveDraftSurvey(toRow(answers), session.user.id, siteId)),
          siteName ?? null,
        );
      }
      router.push('/survey/session');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start survey.');
    } finally {
      starting.current = false;
      setSaving(false);
    }
  };

  // Only reachable through a bad link; normal use always passes a siteId
  if (!siteId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <BackButton style={styles.backButton} />
          <Text style={styles.title} accessibilityRole="header">
            No site selected
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
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton style={styles.backButton} />
        {siteName && <Text style={styles.eyebrow}>Trail survey</Text>}
        <Text style={styles.title} accessibilityRole="header">
          {siteName ?? 'Trail Survey'}
        </Text>

        {Object.entries(sections).map(([sectionName, questions]) => (
          <View key={sectionName} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {sectionName}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add a photo of ${sectionName.toLowerCase()}`}
                accessibilityState={{ expanded: !!openPhotos[sectionName] }}
                onPress={() =>
                  setOpenPhotos(prev => ({
                    ...prev,
                    [sectionName]: !prev[sectionName],
                  }))
                }
                style={({ pressed }) => [
                  styles.cameraButton,
                  pressed && styles.pressed,
                ]}
              >
                <Camera width={20} height={20} />
              </Pressable>
            </View>
            {(openPhotos[sectionName] ||
              (photos[sectionName]?.length ?? 0) > 0) && (
              <View style={styles.photoPicker}>
                <PhotoPicker
                  photos={photos[sectionName] ?? []}
                  onChange={next =>
                    setPhotos(prev => ({ ...prev, [sectionName]: next }))
                  }
                />
              </View>
            )}
            {questions.map(q => (
              <Question
                key={q.column}
                question={q}
                value={answers[q.column]}
                error={errors[q.column]}
                onChange={value => setAnswer(q, value)}
              />
            ))}
          </View>
        ))}

        <Button
          text={saving ? 'Starting…' : 'Start trail session'}
          onPress={handleStart}
          disabled={saving}
          style={styles.reviewButton}
        />
        {message !== '' && <Text style={styles.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
