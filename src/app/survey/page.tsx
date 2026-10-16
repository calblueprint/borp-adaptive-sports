import { useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveDraftSurvey } from '../../../api/supabase/queries/query';
import Question from '../../components/Question/Question';
import {
  Answers,
  AnswerValue,
  Question as QuestionData,
  QUESTIONS,
  toRow,
  validateAll,
  validateAnswer,
} from '../../lib/survey';
import styles from '../../styles/surveyStyles';

const sections = QUESTIONS.reduce<Record<string, QuestionData[]>>(
  (groups, q) => {
    (groups[q.section] ??= []).push(q);
    return groups;
  },
  {},
);

export default function SurveyScreen() {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [surveyId, setSurveyId] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // store answer + check it right away so errors show as user types
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

  // check everything -> save
  const handleSave = async () => {
    const found = validateAll(answers);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage('Fix the highlighted answers first.');
      return;
    }
    setSaving(true);
    try {
      setSurveyId(await saveDraftSurvey(toRow(answers), surveyId));
      setMessage('Draft saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save draft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
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

        <Button title="Save draft" onPress={handleSave} disabled={saving} />
        {message !== '' && <Text style={styles.message}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
