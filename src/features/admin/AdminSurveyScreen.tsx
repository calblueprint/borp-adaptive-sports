import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { questionList } from '@/lib/survey';
import { fetchSurveyDetails } from '~/api/supabase/queries/admin';
import {
  Field,
  LoadState,
  PhotoCard,
  RecordFields,
  TrackButton,
} from './components';
import styles from './styles';
import { useAdminResource } from './useAdminResource';

const answerLabels = Object.fromEntries(
  questionList.map(q => [q.column, q.label]),
);

export default function AdminSurveyScreen() {
  const { surveyId } = useLocalSearchParams<{ surveyId: string }>();
  const load = useCallback(() => fetchSurveyDetails(surveyId), [surveyId]);
  const { data, loading, error, reload } = useAdminResource(load);
  const survey = data?.survey;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        Survey details
      </Text>
      <LoadState loading={loading} error={error} reload={reload} />
      {data && survey && (
        <>
          <Link
            href={{
              pathname: '/admin/sites/[siteId]',
              params: { siteId: data.site.id },
            }}
            style={styles.link}
          >
            All surveys for {data.site.name}
          </Link>
          <View style={styles.card}>
            <Text style={styles.heading}>People</Text>
            <Field
              label="Surveyor"
              value={
                survey.surveyor
                  ? `${survey.surveyor.name} (${survey.surveyor.email})`
                  : survey.surveyor_id
              }
            />
            <Field
              label="Reviewer"
              value={
                survey.reviewer
                  ? `${survey.reviewer.name} (${survey.reviewer.email})`
                  : survey.reviewer_id
              }
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.heading}>Answers and survey information</Text>
            <RecordFields
              record={Object.fromEntries(
                Object.entries(survey).filter(
                  ([key]) => key !== 'surveyor' && key !== 'reviewer',
                ),
              )}
              labels={answerLabels}
            />
          </View>
          <Text style={styles.heading}>Survey items ({data.items.length})</Text>
          {data.items.length === 0 && (
            <Text style={styles.muted}>No survey items recorded.</Text>
          )}
          {data.items.map(item => (
            <View key={item.id} style={styles.card}>
              <RecordFields record={item} />
            </View>
          ))}
          <Text style={styles.heading}>Photos ({data.photos.length})</Text>
          {data.photos.length === 0 && (
            <Text style={styles.muted}>No photos recorded.</Text>
          )}
          {data.photos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
          <Text style={styles.heading}>
            Trail recordings ({data.trails.length})
          </Text>
          {data.trails.length === 0 && (
            <Text style={styles.muted}>No trail recordings linked.</Text>
          )}
          {data.trails.map(trail => (
            <View key={trail.id} style={styles.card}>
              <RecordFields
                record={trail}
                labels={{
                  total_distance_meters: 'Total distance (m)',
                  elevation_gain_m: 'Elevation gain (m)',
                  max_elevation_m: 'Maximum elevation (m)',
                  track_bytes: 'Track size (bytes)',
                }}
              />
              <TrackButton path={trail.storage_path} />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
