import type { MySurvey } from '~/api/supabase/queries/surveys';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/features/profile/ProfileProvider';
import { fetchMySurveys } from '~/api/supabase/queries/surveys';
import fillerImage from '~/assets/bp-icon.png';
import styles from './styles';
import SurveyRow from './SurveyRow';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [surveys, setSurveys] = useState<MySurvey[]>([]);
  const [surveysError, setSurveysError] = useState<string | null>(null);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMySurveys(userId)
      .then(data => {
        if (!cancelled) setSurveys(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setSurveysError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const since = profile
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={fillerImage} style={styles.avatar} />
      <Text style={styles.name}>{profile?.name}</Text>
      <Text style={styles.meta}>Volunteer since {since}</Text>

      <Text style={styles.heading}>How you go on trails</Text>
      <Pressable onPress={() => router.push('/how-you-go')} style={styles.row}>
        <Text style={styles.rowTitle}>
          {profile?.mobility_device ?? 'Add yours'}
        </Text>
        <Text style={styles.meta}>Compare trails with your limits</Text>
      </Pressable>

      <Text style={styles.heading}>Surveys</Text>
      {surveysError && <Text style={styles.error}>Error: {surveysError}</Text>}
      {surveys.map(s => (
        <SurveyRow key={s.id} survey={s} />
      ))}
    </ScrollView>
  );
}
