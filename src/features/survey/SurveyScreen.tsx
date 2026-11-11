import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import Question from '@/components/Question/Question';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  Answers,
  AnswerValue,
  Question as QuestionData,
  questionList,
  toRow,
  validateAll,
  validateAnswer,
} from '@/lib/survey';
import { submitSurvey } from '~/api/supabase/queries/query';
import styles from './styles';

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
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');

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

  const handleReview = () => {
    const found = validateAll(answers);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage('Fix the highlighted answers first.');
      return;
    }
    setMessage('');
    setStep('review');
  };

  const handleSave = async () => {
    if (!session) {
      setMessage('Please log in first.');
      return;
    }
    setSaving(true);
    try {
      await submitSurvey(toRow(answers), session.user.id);
      setSaved(true);
      router.replace('/survey/sent');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not send survey.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'review') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <BackButton
            style={styles.backButton}
            onPress={() => setStep('form')}
          />
          <Text style={styles.eyebrow}>Trail survey</Text>
          <Text style={styles.title}>Review and send</Text>

          {Object.entries(sections).map(([sectionName, questions]) => (
            <View key={sectionName} style={styles.section}>
              <Text style={styles.reviewSectionTitle}>{sectionName}</Text>
              {questions.map(q => (
                <View key={q.column} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{q.label}</Text>
                  <Text style={styles.reviewValue}>
                    {formatAnswer(answers[q.column])}
                  </Text>
                </View>
              ))}
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
        <Text style={styles.title}>Trail Survey</Text>

        {Object.entries(sections).map(([sectionName, questions]) => (
          <View key={sectionName} style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionName}</Text>
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
          text="Review"
          onPress={handleReview}
          style={styles.reviewButton}
        />
        {message !== '' && <Text style={styles.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
