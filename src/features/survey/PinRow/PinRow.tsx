import type { SurveyItem } from '~/api/supabase/queries/surveys';
import { Text, View } from 'react-native';
import { pinTypeLabel } from '@/lib/survey';
import styles from './styles';

type PinRowProps = {
  item: SurveyItem;
  number: number;
  photoCount?: number;
};

export default function PinRow({ item, number, photoCount }: PinRowProps) {
  const photos = photoCount
    ? ` · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
    : '';

  return (
    <View style={styles.pinRow}>
      <View style={styles.pinBadge}>
        <Text style={styles.pinBadgeText}>{number}</Text>
      </View>
      <View style={styles.pinText}>
        <Text style={styles.pinTitle} numberOfLines={1}>
          {pinTypeLabel(item.type)}
          {photos !== '' && <Text style={styles.pinMeta}>{photos}</Text>}
        </Text>
        <Text
          style={[styles.pinNotes, !item.notes && styles.pinNotesEmpty]}
          numberOfLines={2}
        >
          {item.notes || 'No notes'}
        </Text>
      </View>
    </View>
  );
}
