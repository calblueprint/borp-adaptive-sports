import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { fetchSiteSurveys } from '~/api/supabase/queries/admin';
import { LoadState, RecordFields } from './components';
import { formatDate } from './format';
import styles from './styles';
import { useAdminResource } from './useAdminResource';

export default function AdminSiteScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const load = useCallback(() => fetchSiteSurveys(siteId), [siteId]);
  const { data, loading, error, reload } = useAdminResource(load);

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      data={data?.surveys ?? []}
      keyExtractor={survey => survey.id}
      ListHeaderComponent={
        <View style={styles.section}>
          <Link href="/admin" style={styles.link}>
            All sites
          </Link>
          <Text accessibilityRole="header" style={styles.title}>
            {data?.site.name ?? 'Site surveys'}
          </Text>
          <LoadState loading={loading} error={error} reload={reload} />
          {data && (
            <>
              <View style={styles.card}>
                <RecordFields record={data.site} />
              </View>
              <Text style={styles.heading}>
                {data.surveys.length}{' '}
                {data.surveys.length === 1 ? 'survey' : 'surveys'}
              </Text>
              <Text style={styles.muted}>
                Newest created first · All statuses
              </Text>
            </>
          )}
        </View>
      }
      ListEmptyComponent={
        data ? (
          <Text style={styles.text}>No surveys for this site yet.</Text>
        ) : undefined
      }
      renderItem={({ item: survey }) => (
        <Link
          href={{
            pathname: '/admin/surveys/[surveyId]',
            params: { surveyId: survey.id },
          }}
          asChild
        >
          <Pressable accessibilityRole="link" style={styles.card}>
            <Text style={styles.heading}>
              Survey · {survey.status.replaceAll('_', ' ')}
            </Text>
            <Text style={styles.text}>
              Created: {formatDate(survey.created_at)}
            </Text>
            <Text style={styles.text}>Version: {survey.version}</Text>
            <Text style={styles.text}>
              Surveyor: {survey.surveyor?.name ?? survey.surveyor_id}
            </Text>
            <Text style={styles.muted}>{survey.surveyor?.email}</Text>
            <Text style={styles.link}>View all survey details</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
