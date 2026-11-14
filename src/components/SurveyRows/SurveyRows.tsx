// Your surveys as rows: the trail's map thumb, its name, then the status as the last line (Airbnb-style).
// The profile shows the first few; the Surveys page shows them all, in the same order.
import type { Submission } from '@/features/survey/SurveyProvider';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Chevron, ListRow } from '@/components/List/List';
import { PillButton } from '@/components/PillButton/PillButton';
import {
  formatWhen,
  SUBMISSION_LABEL,
  submissionNeedsYou,
} from '@/components/SurveySummary/SurveySummary';
import { TrailSnapshot } from '@/components/TrailImage/TrailImage';
import {
  formatElapsed,
  useElapsed,
  useSurvey,
} from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { type } from '@/styles/theme';
import styles from './styles';

export const openSurvey = (id: string) =>
  router.push({ pathname: '/prototype/account/survey/[id]', params: { id } });

/** What needs you first (one BORP sent back), then newest first. */
export const sortSurveys = (subs: Submission[]) =>
  [...subs].sort(
    (a, b) =>
      Number(submissionNeedsYou(b.status)) -
        Number(submissionNeedsYou(a.status)) || b.sentAt - a.sentAt,
  );

/** The paused survey, so it's easy to pick back up. */
export function InProgress({ trailId }: { trailId: string }) {
  const trail = useTrails().getTrail(trailId);
  const { session } = useSurvey();
  const elapsed = useElapsed(session);
  if (!trail || !session) return null;
  const resume = () => {
    router.push({
      pathname: '/prototype/trail/[id]',
      params: { id: trail.id },
    });
    router.push({
      pathname: '/prototype/survey/[id]/session',
      params: { id: trail.id },
    });
  };
  const pins = session.pins.length;
  return (
    <View style={styles.row}>
      <Thumb>
        <TrailSnapshot trail={trail} variant="thumb" />
      </Thumb>
      <View
        style={styles.flex}
        accessible
        accessibilityLabel={`Paused at ${formatElapsed(elapsed)}, ${trail.name}, ${pins} ${pins === 1 ? 'pin' : 'pins'}`}
      >
        <Text style={type.rowTitle} numberOfLines={1}>
          {trail.name}
        </Text>
        <Text style={styles.meta}>Paused · {formatElapsed(elapsed)}</Text>
      </View>
      <PillButton
        label="Resume"
        onPress={resume}
        accessibilityLabel={`Resume survey of ${trail.name}`}
        style={styles.resume}
      />
    </View>
  );
}

/** The trail, then its status as the last line. One BORP sent back says so in navy, with the start of
 *  their note under it instead of the date. */
export function SurveyRow({
  sub,
  divider,
}: {
  sub: Submission;
  divider: boolean;
}) {
  const trail = useTrails().getTrail(sub.trailId);
  if (!trail) return null;
  const note = submissionNeedsYou(sub.status) ? sub.review?.note : undefined;
  return (
    <ListRow
      onPress={() => openSurvey(sub.id)}
      accessibilityRole="button"
      accessibilityLabel={`${trail.name}, ${SUBMISSION_LABEL[sub.status]}, ${note ? `BORP says: ${note}` : formatWhen(sub.sentAt)}`}
      divider={divider && 'full'}
      style={styles.rowTop}
    >
      <Thumb>
        <TrailSnapshot trail={trail} variant="thumb" />
      </Thumb>
      <View style={styles.flex}>
        <Text style={type.rowTitle} numberOfLines={1}>
          {trail.name}
        </Text>
        {note ? (
          <>
            <Text style={[styles.meta, styles.needsYou]}>
              {SUBMISSION_LABEL[sub.status]}
            </Text>
            <Text style={styles.meta} numberOfLines={2}>
              “{note}”
            </Text>
          </>
        ) : (
          <Text style={styles.meta} numberOfLines={1}>
            {SUBMISSION_LABEL[sub.status]} · {formatWhen(sub.sentAt)}
          </Text>
        )}
      </View>
      <View style={styles.chevron}>
        <Chevron />
      </View>
    </ListRow>
  );
}

function Thumb({ children }: { children: ReactNode }) {
  return <View style={styles.thumb}>{children}</View>;
}
