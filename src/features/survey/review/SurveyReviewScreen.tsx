// Wrap-up — not in Figma yet. Opened from Finish on the paused session (Pause → Finish, like a workout).
// Only what needs you, not everything you did: the trail with your pins on the map (tap one to fix it),
// a one-tap answer for each thing the last survey flagged that no pin re-checked ("Still there", "Gone",
// "Didn't check": a missing pin can mean it's fixed, so ask), voice pins still without details, and an
// optional note. Send fills up as the answers come in. Trailhead answers aren't repeated here; they were
// given minutes ago. Back returns to the paused session.
import type { Session, VoiceNote } from '@/features/survey/SurveyProvider';
import { useState } from 'react';
import { Text, TextInput, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Chips } from '@/components/Chips/Chips';
import { Icon } from '@/components/Icon/Icon';
import { divider, Section } from '@/components/List/List';
import {
  RouteOverview,
  sessionMap,
  walkPosition,
} from '@/components/SessionMap/SessionMap';
import { SurveyLayout } from '@/components/SurveyLayout/SurveyLayout';
import {
  RecDot,
  StopSquare,
  TapToRecord,
  VoiceNoteRow,
} from '@/components/SurveyMedia/SurveyMedia';
import { PinRow } from '@/components/SurveySummary/SurveySummary';
import {
  pinIcon,
  pinMark,
  recheckAnswers,
  recheckCoverage,
  recheckWas,
} from '@/data/survey';
import {
  formatElapsed,
  useElapsed,
  useSurvey,
} from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { colors, GUTTER } from '@/styles/theme';
import styles from './styles';

/** Long enough for the wheel loader to read as "sending", short enough not to feel slow. */
const SEND_MS = 900;

/** 3 min, 1 h 05 min */
function formatDuration(ms: number) {
  const m = Math.max(1, Math.round(ms / 60_000));
  return m < 60
    ? `${m} min`
    : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export default function WrapUpScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = useTrails().getTrail(id);
  const { session: live, answerRecheck, setFocusPin, submit } = useSurvey();
  const { width: screenW } = useWindowDimensions();
  // Keep showing the survey while this screen is replaced by Sent (the session is gone by then)
  const [kept, setKept] = useState<Session | null>(live);
  if (live && live !== kept) setKept(live);
  const session = live ?? kept;
  const elapsed = useElapsed(session);
  const [note, setNote] = useState('');
  const [voice, setVoice] = useState<VoiceNote[]>([]);
  const [rec, setRec] = useState({ recording: false, ms: 0 });
  const [sending, setSending] = useState(false);

  if (!trail || !session) return null;

  const pins = session.pins;
  const map = sessionMap(trail.id);
  const walk = walkPosition(elapsed, map.route, map.aspect);
  const miles = walk.progress * trail.miles;
  const unfinished = pins.filter(p => !p.kind);
  // Re-check items no pin covered: each gets a one-tap answer
  const open = recheckCoverage(trail, pins, session.trailhead).filter(
    r => !r.done,
  );
  const answered = open.filter(r => session.recheck[r.key]).length;
  const waiting = answered < open.length;

  // Back to the session with that pin open on the map
  const openPin = (pinId: string) => {
    setFocusPin(pinId);
    router.back();
  };

  const send = () => {
    setSending(true);
    setTimeout(() => {
      const sub = submit({ note, voice, miles });
      if (!sub) return setSending(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/prototype/survey/[id]/sent',
        params: { id, sub: sub.id },
      });
    }, SEND_MS);
  };

  const summary = [
    `${miles.toFixed(1)} mi`,
    formatDuration(elapsed),
    pins.length && `${pins.length} ${pins.length === 1 ? 'pin' : 'pins'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SurveyLayout
      title={trail.name}
      subtitle={summary}
      cta={
        <ActionButton
          label={
            sending
              ? 'Sending…'
              : waiting
                ? `${answered} of ${open.length} answered`
                : 'Send to BORP'
          }
          loading={sending}
          disabled={waiting}
          progress={open.length ? answered / open.length : undefined}
          onPress={send}
          accessibilityHint={
            waiting
              ? 'Answer the questions from last time first'
              : 'Saves on your phone and sends when there’s signal'
          }
          size="large"
        />
      }
    >
      <RouteOverview
        trailId={trail.id}
        trace={walk.trace}
        pins={pins.map(p => ({
          id: p.id,
          n: p.n,
          x: p.x,
          y: p.y,
          icon: p.kind ? pinIcon(p.kind) : undefined,
          mark: pinMark(p),
          needsDetails: !p.kind,
        }))}
        width={screenW - GUTTER * 2}
        height={220}
        onPinPress={openPin}
      />

      {/* What the last survey flagged and no pin covered. The answers say it: no "not re-checked" list */}
      {open.length ? (
        <Section title="From last time">
          <View>
            {open.map((r, i) => (
              <View key={r.key} style={[styles.question, i > 0 && divider]}>
                <View
                  style={styles.row}
                  accessible
                  accessibilityLabel={`${r.label}, last time ${r.was}`}
                >
                  <Icon
                    name={r.icon}
                    size={20}
                    color={colors.secondary}
                    strokeWidth={1.7}
                  />
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  <Text style={styles.rowWas} numberOfLines={1}>
                    was {recheckWas(r)}
                  </Text>
                </View>
                <Chips
                  options={recheckAnswers(r)}
                  value={session.recheck[r.key]}
                  onChange={v => answerRecheck(r.key, v)}
                  label={r.label}
                  clearable
                />
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {/* Voice pins say "Needs details" in navy on their own row; tapping one opens it on the map */}
      {unfinished.length ? (
        <Section title="Voice pins">
          <View>
            {unfinished.map((p, i) => (
              <PinRow
                key={p.id}
                pin={p}
                divider={i > 0}
                onPress={() => openPin(p.id)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Anything else?">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Detours, closures, how it felt…"
          placeholderTextColor={colors.tertiary}
          multiline
          accessibilityLabel="Note for BORP about the trail as a whole, optional"
          style={styles.note}
        />
        {voice.map((v, i) => (
          <VoiceNoteRow
            key={v.uri}
            note={v}
            index={i}
            onRemove={() => setVoice(list => list.filter(x => x !== v))}
          />
        ))}
        <TapToRecord
          label="Voice note for BORP"
          onNote={n => setVoice(list => [...list, n])}
          onStateChange={setRec}
          style={({ pressed }) => [
            styles.talk,
            rec.recording && styles.talkRec,
            pressed && styles.talkPressed,
          ]}
        >
          {({ recording, ms }) =>
            recording ? (
              <>
                <RecDot />
                <Text style={[styles.talkText, { color: colors.recording }]}>
                  {formatElapsed(ms)}
                </Text>
                <View style={styles.talkStop}>
                  <StopSquare size={10} />
                </View>
              </>
            ) : (
              <>
                <Icon
                  name="mic"
                  size={20}
                  color={colors.ink}
                  strokeWidth={1.8}
                />
                <Text style={styles.talkText}>Record a voice note</Text>
              </>
            )
          }
        </TapToRecord>
      </Section>
    </SurveyLayout>
  );
}
