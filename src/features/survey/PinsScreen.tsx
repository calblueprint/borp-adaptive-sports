import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton/BackButton';
import Button from '@/components/Button/Button';
import { addSurveyItem } from '~/api/supabase/queries/surveys';
import styles from './pinsStyles';

const PIN_TYPES = [
  { value: 'narrow_spot', label: 'Narrow spot' },
  { value: 'steep_stretch', label: 'Steep stretch' },
  { value: 'tilted_path', label: 'Tilted path' },
  { value: 'surface', label: 'Surface' },
  { value: 'obstacle', label: 'Obstacle' },
  { value: 'something_else', label: 'Something else' },
];

type Props = {
  surveyId: string;
  pinCount: number;
  onPinAdded: () => void;
  onBack: () => void;
  onFinish: () => void;
};

export default function PinsScreen({
  surveyId,
  pinCount,
  onPinAdded,
  onBack,
  onFinish,
}: Props) {
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const handlePin = async (type: string, label: string) => {
    setAdding(true);
    setMessage('');
    try {
      await addSurveyItem(surveyId, type, notes);
      onPinAdded();
      setNotes('');
      setMessage(`Pin ${pinCount + 1} saved: ${label}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save pin.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton onPress={onBack} />
        <Text style={styles.eyebrow}>Trail session</Text>
        <Text style={styles.title} accessibilityRole="header">
          What’s here? Pin {pinCount + 1}
        </Text>

        <View style={styles.grid}>
          {PIN_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={styles.typeButton}
              disabled={adding}
              onPress={() => void handlePin(t.value, t.label)}
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
        <Button text="Finish" onPress={onFinish} disabled={adding} />
      </View>
    </SafeAreaView>
  );
}
