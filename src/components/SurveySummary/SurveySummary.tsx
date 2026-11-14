// What a finished survey looks like, shared by Review and send (src/app/survey/[id]/review.tsx), the Sent
// screen and a survey opened from the profile. Not in Figma yet; styled like the trail details screen.
import { Image, Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon/Icon';
import { PinBubble } from '@/components/SessionMap/SessionMap';
import { surveyStyles } from '@/components/SurveyLayout/SurveyLayout';
import { formatPinValue, pinIcon, pinKind, pinMark } from '@/data/survey';
import {
  type Pin,
  type SubmissionStatus,
} from '@/features/survey/SurveyProvider';
import { colors } from '@/styles/theme';
import styles from './styles';

/* ---------- Dates ---------- */

/** Oct 28, 2026 */
export const formatDay = (ms: number) =>
  new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/** Today, Yesterday, Oct 19, or Apr 27, 2025 for other years */
export function formatWhen(ms: number) {
  const d = new Date(ms);
  const now = new Date();
  const days = Math.round(
    (new Date(now.toDateString()).getTime() -
      new Date(d.toDateString()).getTime()) /
      86_400_000,
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
}

/* ---------- Stats ---------- */

export type Stat = { value: string; unit?: string; label: string };

/** Big number, small unit, quiet caption under it, like the trail page readings. No boxes or dividers. */
export function Stats({ items }: { items: Stat[] }) {
  return (
    <View style={styles.stats}>
      {items.map(s => (
        <View
          key={s.label}
          style={styles.stat}
          accessible
          accessibilityLabel={`${s.label}: ${s.value}${s.unit ? ` ${s.unit}` : ''}`}
        >
          <Text style={styles.statValue} numberOfLines={1}>
            {s.value}
            {s.unit ? <Text style={styles.statUnit}> {s.unit}</Text> : null}
          </Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- Pins ---------- */

/** The pin as it looks on the map, small; hollow for a voice pin that still needs details. */
export function PinBadge({ pin }: { pin: Pin }) {
  return <PinBubble icon={pinIcon(pin.kind)} hollow={!pin.kind} />;
}

export function PinRow({
  pin,
  divider,
  onPress,
}: {
  pin: Pin;
  divider?: boolean;
  onPress?: () => void;
}) {
  const k = pin.kind ? pinKind(pin.kind) : undefined;
  const mark = pinMark(pin);
  // The photo shows itself at the end of the row; only voice notes need words
  const photo = pin.photos[0];
  const photos = pin.photos.length
    ? `, ${pin.photos.length} photo${pin.photos.length > 1 ? 's' : ''}`
    : '';
  const media = pin.voice.length ? `${pin.voice.length} voice` : '';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Pin ${pin.n}, ${k?.label ?? 'voice pin'}, ${formatPinValue(pin)}${mark === 'warn' ? ', outside the guideline' : ''}${photos}`}
      accessibilityHint={onPress ? 'Opens it on the map' : undefined}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        pressed && surveyStyles.pressed,
      ]}
    >
      <PinBadge pin={pin} />
      <View style={styles.flex}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {k?.label ?? 'Voice pin'}
          <Text style={styles.rowMi}> · {pin.mi.toFixed(1)} mi</Text>
        </Text>
        <Text
          style={[styles.rowValue, !k && styles.rowNeeds]}
          numberOfLines={1}
        >
          {formatPinValue(pin)}
          {/* Outside the guideline: say how, in navy, rather than a warning glyph */}
          {mark === 'warn' && k?.fails ? (
            <Text style={styles.rowNeeds}> · {k.fails}</Text>
          ) : null}
          {media ? ` · ${media}` : ''}
        </Text>
      </View>
      {photo !== undefined ? (
        <Image
          source={typeof photo === 'string' ? { uri: photo } : photo}
          style={styles.rowPhoto}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {onPress ? (
        <Icon name="next" size={16} color={colors.quaternary} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

/* ---------- Submission status ---------- */

export const SUBMISSION_LABEL: Record<SubmissionStatus, string> = {
  waiting: 'Waiting for signal',
  review: 'In review',
  changes: 'Changes requested',
  published: 'Published',
};

/** Only "Changes requested" needs you, so only it gets the navy accent; the rest recede to grey. */
export const submissionNeedsYou = (status: SubmissionStatus) =>
  status === 'changes';

/* ---------- What happens next ---------- */

type StepState = 'done' | 'now' | 'warn' | 'next';

/** Sent → BORP reviews it → On Access California, with where this survey is. BORP's note, if they wrote
 *  one, hangs off the step it came with, as a message: it's a person talking, so it gets a bubble. */
export function NextSteps({
  status,
  sentAt,
  reviewedAt,
  note,
}: {
  status: SubmissionStatus;
  sentAt: number;
  reviewedAt?: number;
  note?: string;
}) {
  const steps: {
    title: string;
    detail: string;
    state: StepState;
    note?: string;
  }[] = [
    status === 'waiting'
      ? {
          title: 'Waiting for signal',
          detail: 'Sends by itself. You can close the app.',
          state: 'now',
        }
      : { title: 'Sent to BORP', detail: formatDay(sentAt), state: 'done' },
    status === 'changes'
      ? {
          title: 'BORP asked for a change',
          detail: reviewedAt ? formatDay(reviewedAt) : 'See their note',
          state: 'warn',
          note,
        }
      : status === 'published'
        ? {
            title: 'Reviewed by BORP',
            detail: reviewedAt ? formatDay(reviewedAt) : 'Approved',
            state: 'done',
            note,
          }
        : {
            title: 'BORP reviews it',
            detail: 'Usually within a week. We’ll let you know.',
            state: status === 'review' ? 'now' : 'next',
          },
    status === 'published'
      ? {
          title: 'On Access California',
          detail: 'Anyone planning a visit can see it',
          state: 'done',
        }
      : {
          title: 'Published on Access California',
          detail: 'Once approved, the trail page updates',
          state: 'next',
        },
  ];
  return (
    <View>
      {steps.map((s, i) => (
        <View
          key={s.title}
          style={styles.step}
          accessible
          accessibilityLabel={`${s.title}. ${s.detail}${s.state === 'done' ? ', done' : s.state === 'now' ? ', in progress' : ''}${s.note ? `. BORP says: ${s.note}` : ''}`}
        >
          <View style={styles.rail}>
            {/* Done and needs-you share the black dot; the glyph (check or "!") tells them apart, at one weight */}
            <View
              style={[
                styles.dot,
                (s.state === 'done' || s.state === 'warn') && styles.dotDone,
                s.state === 'now' && styles.dotNow,
              ]}
            >
              {s.state === 'done' || s.state === 'warn' ? (
                <Icon
                  name={s.state === 'done' ? 'check' : 'exclaim'}
                  size={12}
                  color={colors.white}
                  strokeWidth={2.6}
                />
              ) : null}
            </View>
            {i < steps.length - 1 ? (
              <View
                style={[styles.line, s.state === 'done' && styles.lineDone]}
              />
            ) : null}
          </View>
          <View style={styles.stepBody}>
            <Text
              style={[
                styles.stepTitle,
                s.state === 'next' && styles.stepTitleNext,
              ]}
            >
              {s.title}
            </Text>
            <Text style={surveyStyles.faint}>{s.detail}</Text>
            {s.note ? (
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{s.note}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
