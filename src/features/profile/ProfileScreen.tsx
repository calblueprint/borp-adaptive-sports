import type { MySurvey } from '~/api/supabase/queries/surveys';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import Header from '@/components/Header/Header';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSignOut } from '@/features/auth/useSignOut';
import { useProfile } from '@/features/profile/ProfileProvider';
import { fetchMySurveys } from '~/api/supabase/queries/surveys';
import fillerImage from '~/assets/bp-icon.png';
import styles from './styles';
import SurveyRow from './SurveyRow';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const { signOut, busy, error: signOutError } = useSignOut();
  const [surveys, setSurveys] = useState<MySurvey[]>([]);
  const [surveysError, setSurveysError] = useState<string | null>(null);

  const userId = session?.user.id;

  // Tab screens stay mounted, so refetch each time Profile is opened
  // (e.g. after sending a survey)
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      fetchMySurveys(userId)
        .then(data => {
          if (!cancelled) {
            setSurveys(data);
            setSurveysError(null);
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setSurveysError(e.message);
        });
      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  const since = profile
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={fillerImage} style={styles.avatar} />
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.meta}>Volunteer since {since}</Text>

        <Text style={styles.heading}>How you go on trails</Text>
        <Pressable
          onPress={() => router.push('/how-you-go')}
          style={styles.row}
        >
          <Text style={styles.rowTitle}>
            {profile?.mobility_device ?? 'Add yours'}
          </Text>
          <Text style={styles.meta}>Compare trails with your limits</Text>
        </Pressable>

        {profile?.role === 'admin' && (
          <>
            <Text style={styles.heading}>Admin</Text>
            <Pressable
              onPress={() => router.push('/admin')}
              style={styles.row}
              accessibilityRole="link"
            >
              <Text style={styles.rowTitle}>Admin dashboard</Text>
              <Text style={styles.meta}>Review sites and surveys</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.heading}>Surveys</Text>
        {surveysError && (
          <Text style={styles.error}>Error: {surveysError}</Text>
        )}
        {surveys.map(s => (
          <SurveyRow key={s.id} survey={s} />
        ))}

        {signOutError && (
          <Text style={styles.error} accessibilityRole="alert">
            {signOutError}
          </Text>
        )}
        <Button
          text={busy ? 'Logging out…' : 'Log out'}
          disabled={busy}
          onPress={() => void signOut()}
          style={styles.logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
