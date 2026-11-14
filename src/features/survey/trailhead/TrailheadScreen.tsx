// At the trailhead (step 2 of 3) — not in Figma yet. Four quick taps (parking, restroom, sign, water).
// On a resurvey, the last survey's answer is shaded a darker grey with a clock turning back, so a change shows
// at a glance; one line under the title says so, since a first-time resurveyor wouldn't guess what the shading means.
// The ? beside each name opens a one-line how-to for non-experts. Tapping a chosen answer again clears it.
// No boxes: each check is a heading, its answers and a hairline. Things the last survey flagged carry
// a navy "Re-check" eyebrow above the name, like a trail's status. The camera and mic beside each check
// add a photo (tap) or a voice note (hold); they show up under the answers once there are any.
// The bottom button fills a quarter per answer and counts them, so it's clear all four unlock it.
import type { TrailheadQuestion } from '@/data/survey';
import type { Trail } from '@/data/trails';
import type { Evidence } from '@/features/survey/SurveyProvider';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Chips } from '@/components/Chips/Chips';
import { Icon } from '@/components/Icon/Icon';
import { divider } from '@/components/List/List';
import { SurveyLayout } from '@/components/SurveyLayout/SurveyLayout';
import {
  PhotoThumb,
  RecDot,
  StopSquare,
  takePhoto,
  TapToRecord,
  VoiceNoteRow,
} from '@/components/SurveyMedia/SurveyMedia';
import { TRAILHEAD_QUESTIONS } from '@/data/survey';
import {
  formatElapsed,
  NO_EVIDENCE,
  useSurvey,
} from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { colors } from '@/styles/theme';
import styles from './styles';

export default function TrailheadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = useTrails().getTrail(id);
  const {
    drafts,
    answerTrailhead,
    draftMedia,
    updateTrailheadMedia,
    startSession,
  } = useSurvey();
  if (!trail) return null;
  const answers = drafts[trail.id] ?? {};
  const total = TRAILHEAD_QUESTIONS.length;
  const answered = TRAILHEAD_QUESTIONS.filter(q => answers[q.key]).length;
  const left = total - answered;

  const start = () => {
    startSession(trail.id);
    router.push({ pathname: '/prototype/survey/[id]/session', params: { id } });
  };

  return (
    <SurveyLayout
      step={2}
      title="At the trailhead"
      subtitle={
        trail.status === 'due' && trail.trailhead
          ? "The last survey's answers are shaded."
          : undefined
      }
      cta={
        <ActionButton
          label={
            left > 0 ? `${answered} of ${total} answered` : 'Start the trail'
          }
          disabled={left > 0}
          progress={answered / total}
          accessibilityLabel={
            left > 0
              ? `Start the trail, ${answered} of ${total} answered`
              : undefined
          }
          accessibilityHint={left > 0 ? `Answer ${left} more first` : undefined}
          onPress={start}
          size="large"
        />
      }
    >
      <View>
        {TRAILHEAD_QUESTIONS.map((q, i) => (
          <Question
            key={q.key}
            q={q}
            trail={trail}
            first={i === 0}
            value={answers[q.key]}
            onChange={v => answerTrailhead(trail.id, q.key, v)}
            media={draftMedia[trail.id]?.[q.key] ?? NO_EVIDENCE}
            onMedia={update => updateTrailheadMedia(trail.id, q.key, update)}
          />
        ))}
      </View>
    </SurveyLayout>
  );
}

type QuestionProps = {
  q: TrailheadQuestion;
  trail: Trail;
  first: boolean;
  value?: string;
  onChange: (v: string | undefined) => void;
  media: Evidence;
  onMedia: (update: (e: Evidence) => Evidence) => void;
};

function Question({
  q,
  trail,
  first,
  value,
  onChange,
  media,
  onMedia,
}: QuestionProps) {
  const [help, setHelp] = useState(false);
  const [rec, setRec] = useState({ recording: false, ms: 0 });
  const last = trail.trailhead?.[q.key];
  const recheck = last?.mark === 'warn';
  const name = q.label.toLowerCase();

  const addPhoto = async () => {
    const uri = await takePhoto();
    if (uri) onMedia(e => ({ ...e, photos: [...e.photos, uri] }));
  };

  return (
    <View style={[styles.question, !first && divider]}>
      <View style={styles.head}>
        <Icon name={q.key} size={22} color={colors.ink} strokeWidth={1.7} />
        <View style={styles.flex}>
          {recheck ? (
            <Text
              style={styles.eyebrow}
              accessibilityLabel="Re-check from last survey"
            >
              Re-check
            </Text>
          ) : null}
          {rec.recording ? (
            // Takes the name's place while the mic is held, so nothing below jumps
            <View style={styles.recording} accessibilityLiveRegion="polite">
              <RecDot size={8} />
              <Text style={styles.recordingText}>{formatElapsed(rec.ms)}</Text>
            </View>
          ) : (
            <View style={styles.labelRow}>
              <Text style={styles.label} accessibilityRole="header">
                {q.label}
              </Text>
              <Pressable
                onPress={() => setHelp(h => !h)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`How to tell, ${name}`}
                accessibilityState={{ expanded: help }}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Icon
                  name="help"
                  size={19}
                  color={help ? colors.navy : colors.tertiary}
                  strokeWidth={1.8}
                />
              </Pressable>
            </View>
          )}
        </View>
        <Pressable
          onPress={addPhoto}
          hitSlop={2}
          accessibilityRole="button"
          accessibilityLabel={`Add a photo of the ${name}`}
          style={({ pressed }) => [
            styles.capture,
            pressed && styles.capturePressed,
          ]}
        >
          <Icon name="camera" size={20} color={colors.navy} strokeWidth={1.8} />
        </Pressable>
        <TapToRecord
          label={`Voice note about the ${name}`}
          onNote={note => onMedia(e => ({ ...e, voice: [...e.voice, note] }))}
          onStateChange={setRec}
          style={({ pressed }) => [
            styles.capture,
            pressed && styles.capturePressed,
            rec.recording && styles.captureRecording,
          ]}
        >
          {({ recording }) =>
            recording ? (
              <StopSquare size={14} />
            ) : (
              <Icon
                name="mic"
                size={20}
                color={colors.navy}
                strokeWidth={1.8}
              />
            )
          }
        </TapToRecord>
      </View>

      {help ? (
        <Animated.Text entering={FadeIn.duration(200)} style={styles.help}>
          {q.howTo}
        </Animated.Text>
      ) : null}

      <Chips
        options={q.options}
        value={value}
        onChange={onChange}
        label={q.question}
        clearable
        previous={last?.answer}
      />

      {media.photos.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
          style={styles.thumbsRow}
        >
          {media.photos.map(uri => (
            <PhotoThumb
              key={uri}
              uri={uri}
              onRemove={() =>
                onMedia(e => ({
                  ...e,
                  photos: e.photos.filter(p => p !== uri),
                }))
              }
            />
          ))}
        </ScrollView>
      ) : null}
      {media.voice.length ? (
        <View style={styles.notes}>
          {media.voice.map((v, i) => (
            <VoiceNoteRow
              key={v.uri}
              note={v}
              index={i}
              onRemove={() =>
                onMedia(e => ({
                  ...e,
                  voice: e.voice.filter(x => x.uri !== v.uri),
                }))
              }
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
