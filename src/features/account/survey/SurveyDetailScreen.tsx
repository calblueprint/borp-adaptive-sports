// One of your surveys, opened from the profile — not in Figma yet. Read-only, in the order you'd ask:
//   1. Where is it with BORP?  the three steps, with BORP's note as a message on the step it came with
//   2. What did I send?        the route with your pins on it, then the pins as a list that mirrors it
//   3. The trailhead and your note
// Trail name with `2.4 mi · 52 min · 7 pins` under it, like the wrap-up: no stat row, no tinted panel.
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Icon } from '@/components/Icon/Icon';
import { divider, Section } from '@/components/List/List';
import { RouteOverview, sessionMap } from '@/components/SessionMap/SessionMap';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import { surveyStyles } from '@/components/SurveyLayout/SurveyLayout';
import { PhotoThumb, VoiceNoteRow } from '@/components/SurveyMedia/SurveyMedia';
import { NextSteps, PinRow } from '@/components/SurveySummary/SurveySummary';
import { pinIcon, pinMark, TRAILHEAD_QUESTIONS } from '@/data/survey';
import { useSurvey } from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { colors, GUTTER } from '@/styles/theme';
import styles from './styles';

/** 52 min, 1 h 05 min */
function formatDuration(ms: number) {
  const m = Math.max(1, Math.round(ms / 60_000));
  return m < 60
    ? `${m} min`
    : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export default function SubmissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sub = useSurvey().submissions.find(s => s.id === id);
  const trail = useTrails().getTrail(sub?.trailId ?? '');
  const { width } = useWindowDimensions();

  if (!sub || !trail) {
    return (
      <SubScreen title="Survey not found">
        <Text style={surveyStyles.meta}>
          It may have been removed from this phone.
        </Text>
      </SubScreen>
    );
  }

  const pins = sub.pins.length;
  const summary = [
    `${sub.miles.toFixed(1)} mi`,
    formatDuration(sub.elapsed),
    pins && `${pins} ${pins === 1 ? 'pin' : 'pins'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SubScreen
      title={trail.name}
      subtitle={summary}
      cta={
        <ActionButton
          label="View trail"
          variant="soft"
          size="large"
          onPress={() =>
            router.push({
              pathname: '/prototype/trail/[id]',
              params: { id: trail.id },
            })
          }
          style={styles.cta}
        />
      }
    >
      <NextSteps
        status={sub.status}
        sentAt={sub.sentAt}
        reviewedAt={sub.review?.at}
        note={sub.review?.note}
      />

      {pins ? (
        <Section title="Your pins">
          <View
            style={styles.map}
            accessible
            accessibilityLabel={`Map of ${trail.name} with your ${pins} pins, listed below`}
          >
            <RouteOverview
              trailId={trail.id}
              trace={sessionMap(trail.id).route}
              pins={sub.pins.map(p => ({
                id: p.id,
                n: p.n,
                x: p.x,
                y: p.y,
                icon: p.kind ? pinIcon(p.kind) : undefined,
                mark: pinMark(p),
                needsDetails: !p.kind,
              }))}
              width={width - GUTTER * 2}
              // Session maps are tall (the route runs top to bottom), so the whole route needs a tall frame
              height={Math.round((width - GUTTER * 2) * 1.1)}
            />
          </View>
          <View>
            {sub.pins.map((p, i) => (
              <PinRow key={p.id} pin={p} divider={i > 0} />
            ))}
          </View>
        </Section>
      ) : null}

      {/* The answer says what it is next to its icon ("Van accessible"), so no label column */}
      <Section title="At the trailhead">
        <View>
          {TRAILHEAD_QUESTIONS.map((q, i) => {
            const media = sub.trailheadMedia?.[q.key];
            const answer = sub.trailhead[q.key];
            return (
              <View key={q.key} style={[styles.thItem, i > 0 && divider]}>
                <View
                  style={styles.th}
                  accessible
                  accessibilityLabel={`${q.label}: ${answer ?? 'not answered'}`}
                >
                  <Icon
                    name={q.key}
                    size={22}
                    color={colors.ink}
                    strokeWidth={1.7}
                  />
                  <Text style={[styles.thValue, !answer && styles.thNone]}>
                    {answer ?? 'Not answered'}
                  </Text>
                </View>
                {media?.photos.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thPhotos}
                  >
                    {media.photos.map(uri => (
                      <PhotoThumb key={uri} uri={uri} />
                    ))}
                  </ScrollView>
                ) : null}
                {media?.voice.map((v, j) => (
                  <VoiceNoteRow key={v.uri} note={v} index={j} />
                ))}
              </View>
            );
          })}
        </View>
      </Section>

      {sub.note || sub.voice.length ? (
        <Section title="Your note">
          {sub.note ? <Text style={styles.note}>{sub.note}</Text> : null}
          {sub.voice.map((v, i) => (
            <VoiceNoteRow key={v.uri} note={v} index={i} />
          ))}
        </Section>
      ) : null}
    </SubScreen>
  );
}
