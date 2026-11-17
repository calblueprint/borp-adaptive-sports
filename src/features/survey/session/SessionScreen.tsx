import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import { addSurveyItem } from '~/api/supabase/queries/surveys';
import { useSurvey } from '../SurveyProvider';
import styles from './styles';

const ITEM_TYPES = [
  { value: 'narrow_spot', label: 'Narrow spot' },
  { value: 'steep_stretch', label: 'Steep stretch' },
  { value: 'tilted_path', label: 'Tilted path' },
  { value: 'surface', label: 'Surface' },
  { value: 'obstacle', label: 'Obstacle' },
  { value: 'something_else', label: 'Something else' },
];

export default function SessionScreen() {
  const router = useRouter();
  const { surveyId, itemCount, addItem, setStep } = useSurvey();
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddItem = async (type: string, label: string) => {
    if (!surveyId) return;
    setAdding(true);
    setMessage('');
    try {
      await addSurveyItem(surveyId, type, notes);
      addItem();
      setNotes('');
      setMessage(`Pin ${itemCount + 1} saved: ${label}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save pin.');
    } finally {
      setAdding(false);
    }
  };

  const handleFinish = () => {
    setStep('review');
    router.back();
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
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton />
        <Text style={styles.eyebrow}>Trail session</Text>
        <Text style={styles.title} accessibilityRole="header">
          What’s here? Pin {itemCount + 1}
        </Text>

        <View style={styles.grid}>
          {ITEM_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={styles.typeButton}
              disabled={adding}
              onPress={() => void handleAddItem(t.value, t.label)}
            >
              <Text style={styles.typeButtonText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.notes}
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        {message !== '' && <Text style={styles.message}>{message}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button text="Finish" onPress={handleFinish} disabled={adding} />
      </View>
    </SafeAreaView>
  );
}
