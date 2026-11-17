import type { LocalPhoto } from '@/lib/photos';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import Question from '@/components/Question/Question';
import { useAuth } from '@/features/auth/AuthProvider';
import Camera from '@/icons/camera.svg';
import {
  Answers,
  AnswerValue,
  Question as QuestionData,
  questionList,
  toRow,
  validateAll,
  validateAnswer,
} from '@/lib/survey';
import { uploadSurveyPhotos } from '~/api/supabase/queries/photos';
import { saveDraftSurvey, submitSurvey } from '~/api/supabase/queries/surveys';
import styles from './styles';
import { useSurvey } from './SurveyProvider';

const sections = questionList.reduce<Record<string, QuestionData[]>>(
  (groups, q) => {
    (groups[q.section] ??= []).push(q);
    return groups;
  },
  {},
);

const formatAnswer = (v: AnswerValue | undefined) => {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return String(v);
};

export default function SurveyScreen() {
  const { session } = useAuth();
  const { siteId, siteName } = useLocalSearchParams<{
    siteId?: string;
    siteName?: string;
  }>();
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { surveyId, setSurveyId, step, setStep } = useSurvey();
  const [photos, setPhotos] = useState<Record<string, LocalPhoto[]>>({});
  const [openPhotos, setOpenPhotos] = useState<Record<string, boolean>>({});

  const setAnswer = (q: QuestionData, value: AnswerValue) => {
    setSaved(false);
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
    setMessage('');
    setSaving(true);

    try {
      if (!surveyId) {
        const id = await saveDraftSurvey(
          toRow(answers),
          session.user.id,
          siteId,
        );
        setSurveyId(id);
      }
      router.push('/survey/session');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start survey.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!surveyId) {
      setMessage('Start the trail session first.');
      return;
    }
    setSaving(true);
    try {
      await submitSurvey(toRow(answers), surveyId);
      setSaved(true);

      const allPhotos = Object.values(photos).flat();

      if (allPhotos.length > 0) {
        const failed = await uploadSurveyPhotos(surveyId, allPhotos);
        if (failed > 0)
          Alert.alert(
            'Survey sent',
            `${failed} of ${allPhotos.length} photos couldn’t be uploaded.`,
          );
      }
      router.replace('/survey/sent');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not send survey.');
    } finally {
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

  if (step === 'review') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <BackButton
            style={styles.backButton}
            onPress={() => {
              setStep('form');
              router.push('/survey/session');
            }}
          />
          <Text style={styles.eyebrow}>{siteName ?? 'Trail survey'}</Text>
          <Text style={styles.title} accessibilityRole="header">
            Review and send
          </Text>

          {Object.entries(sections).map(([sectionName, questions]) => (
            <View key={sectionName} style={styles.section}>
              <Text
                style={styles.reviewSectionTitle}
                accessibilityRole="header"
              >
                {sectionName}
              </Text>
              {questions.map(q => (
                <View key={q.column} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{q.label}</Text>
                  <Text style={styles.reviewValue}>
                    {formatAnswer(answers[q.column])}
                  </Text>
                </View>
              ))}
              {(photos[sectionName]?.length ?? 0) > 0 && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Photos</Text>
                  <Text style={styles.reviewValue}>
                    {photos[sectionName].length}
                  </Text>
                </View>
              )}
            </View>
          ))}
          {message !== '' && <Text style={styles.message}>{message}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text={saving ? 'Sending…' : 'Send to BORP'}
            onPress={handleSave}
            disabled={saving || saved}
          />
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
