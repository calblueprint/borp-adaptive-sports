import type { MySurvey } from '~/api/supabase/queries/surveys';
import { Image, Text, View } from 'react-native';
import fillerImage from '~/assets/bp-icon.png';
import styles from './styles';

export default function SurveyRow({ survey }: { survey: MySurvey }) {
  return (
    <View style={styles.surveyRow}>
      <Image source={fillerImage} style={styles.thumb} />
      <View style={styles.surveyText}>
        <Text style={styles.rowTitle}>
          {survey.site?.name ?? 'Unknown trail'}
        </Text>
        <Text style={styles.meta}>
          lat: {survey.site?.lat} · lng: {survey.site?.lng}
        </Text>
        <Text style={styles.meta}>{survey.status}</Text>
      </View>
    </View>
  );
}
