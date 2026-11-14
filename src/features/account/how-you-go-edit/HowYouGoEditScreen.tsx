// One chair, walker… — not in Figma yet. The person picks what it is (manual or power chair, scooter,
// walker, cane or crutches, walking, bike); that pre-picks typical limits, so a newcomer can just tap Save. Trail pages then
// compare readings with the one in use instead of the general guideline, and drop the ones that don't apply
// (no width for a cane or walking). An optional name tells two chairs apart. `new` adds one; any other id edits it.
// Not listed? "Other" asks what it is instead, right under the choices, and that answer is its name.
// Width is a fact they can find out (their chair's own width, from a tape measure or its label), so it's a
// number with a ? for how to measure. Nobody knows their comfortable grade in percent, so slopes are three
// plain choices: a word (Gentle, Steep…) over the slope drawn as the survey's Level line, with the number
// small underneath. Big tap targets, works with gloves, nothing to type.
import type { IconName } from '@/components/Icon/Icon';
import type { Mobility } from '@/features/account/AccountProvider';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Chips } from '@/components/Chips/Chips';
import { Field } from '@/components/Field/Field';
import { AID_ICON, Icon } from '@/components/Icon/Icon';
import { SubScreen } from '@/components/SubScreen/SubScreen';
import {
  aidName,
  aidOf,
  AIDS,
  fmtLimit,
  LIMIT_CHOICES,
  useAccount,
} from '@/features/account/AccountProvider';
import { colors } from '@/styles/theme';
import styles from './styles';

const QUESTIONS: {
  key: 'grade' | 'cross';
  icon: IconName;
  label: string;
  unit: string;
  spoken: string;
}[] = [
  {
    key: 'grade',
    icon: 'slope',
    label: 'Steepest slope you can manage',
    unit: '%',
    spoken: 'percent grade',
  },
  {
    key: 'cross',
    icon: 'cross',
    label: 'Most sideways tilt you can manage',
    unit: '%',
    spoken: 'percent tilt',
  },
];

export default function AidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { aids, saveAid, removeAid } = useAccount();
  const existing = aids.find(a => a.id === id);
  const [draft, setDraft] = useState<Mobility | undefined>(existing);
  const [name, setName] = useState(existing?.name ?? '');

  // A new kind starts from its own typical answers; the same kind keeps what they've picked
  const pick = (label: string | undefined) => {
    const aid = AIDS.find(a => a.label === label);
    if (!aid || aid.key === draft?.aid) return;
    Haptics.selectionAsync();
    setDraft(aid.start);
  };
  const other = draft?.aid === 'other';
  const canSave = !!draft && (!other || !!name.trim());
  const save = () => {
    if (!draft || !canSave) return;
    saveAid({
      ...draft,
      id: existing?.id ?? String(Date.now()),
      name: name.trim() || undefined,
    });
    router.back();
  };
  const remove = () => {
    if (!existing) return;
    removeAid(existing.id);
    router.back();
  };

  return (
    <SubScreen
      title={existing ? aidName(existing) : 'How you go on trails'}
      cta={
        <ActionButton
          label="Save"
          onPress={save}
          disabled={!canSave}
          accessibilityHint={
            !draft
              ? 'Choose how you go first'
              : canSave
                ? undefined
                : 'Say what you use first'
          }
          size="large"
        />
      }
    >
      <Chips
        label="How you go on trails"
        options={AIDS.map(a => a.label)}
        value={draft ? aidOf(draft.aid).label : undefined}
        onChange={pick}
        // The same side-on drawings as the How you go list, so "Walker" and "Scooter" are seen, not just read
        icon={(label, color) => {
          const aid = AIDS.find(a => a.label === label);
          return aid ? (
            <Icon
              name={AID_ICON[aid.key]}
              size={20}
              color={color}
              strokeWidth={1.7}
            />
          ) : null;
        }}
      />

      {draft ? (
        // Keyed by the kind, so its own answers fade in when it changes
        <Animated.View
          key={draft.aid}
          entering={FadeIn.duration(220)}
          style={styles.form}
        >
          {other ? (
            <Field
              label="What do you use?"
              labelGap={8}
              value={name}
              onChangeText={setName}
              placeholder="Hand cycle, trail chair…"
              autoFocus={!existing}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          ) : null}
          {draft.width !== undefined ? (
            <WidthQuestion
              label={
                other
                  ? 'How wide is it?'
                  : `How wide is your ${aidOf(draft.aid).noun ?? 'chair'}?`
              }
              measure={aidOf(draft.aid).measure}
              value={draft.width}
              onChange={v => setDraft(d => d && { ...d, width: v })}
            />
          ) : null}
          {QUESTIONS.map(q => (
            <Question
              key={q.key}
              question={q}
              value={draft[q.key]!}
              onChange={v => setDraft(d => d && { ...d, [q.key]: v })}
            />
          ))}
          {other ? null : (
            <Field
              label="Name"
              labelGap={8}
              value={name}
              onChangeText={setName}
              placeholder={aidOf(draft.aid).label}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          )}
        </Animated.View>
      ) : null}

      {existing ? (
        <Pressable
          onPress={remove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${aidName(existing)}`}
          style={({ pressed }) => [styles.quiet, pressed && styles.pressed]}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      ) : null}
    </SubScreen>
  );
}

/** Three choices side by side, the number under each. Black once chosen, like chips. Slopes show the slope. */
function Question({
  question: q,
  value,
  onChange,
}: {
  question: (typeof QUESTIONS)[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const choices = LIMIT_CHOICES[q.key];
  // A value from before these choices existed lights up the closest one
  const chosen = choices.reduce((best, c) =>
    Math.abs(c.value - value) < Math.abs(best.value - value) ? c : best,
  ).value;
  return (
    <View style={styles.question}>
      <View style={styles.head}>
        <Icon
          name={q.icon}
          size={20}
          color={colors.secondary}
          strokeWidth={1.7}
        />
        <Text style={styles.label}>{q.label}</Text>
      </View>
      <View
        style={styles.choices}
        accessibilityRole="radiogroup"
        accessibilityLabel={q.label}
      >
        {choices.map(c => {
          const on = c.value === chosen;
          return (
            <Pressable
              key={c.label}
              onPress={() => {
                if (on) return;
                Haptics.selectionAsync();
                onChange(c.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${c.label}, ${fmtLimit(c.value)} ${q.spoken}`}
              style={({ pressed }) => [
                styles.choice,
                pressed && styles.choicePressed,
                on && styles.choiceOn,
              ]}
            >
              <SlopeLine percent={c.value} on={on} />
              <Text
                style={[styles.choiceLabel, on && styles.onText]}
                numberOfLines={2}
              >
                {c.label}
              </Text>
              <Text style={[styles.choiceValue, on && styles.onValue]}>
                {fmtLimit(c.value)}
                {q.unit}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** How wide the chair (walker…) is: a number they can measure, so a stepper, starting at a typical width. */
function WidthQuestion({
  label,
  measure,
  value,
  onChange,
}: {
  label: string;
  measure?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [help, setHelp] = useState(false);
  const nudge = (d: number) => {
    const next = Math.min(40, Math.max(16, value + d));
    if (next !== value) Haptics.selectionAsync();
    onChange(next);
  };
  return (
    <View style={styles.question}>
      <View style={styles.head}>
        <Icon
          name="width"
          size={20}
          color={colors.secondary}
          strokeWidth={1.7}
        />
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => setHelp(h => !h)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="How to measure"
          accessibilityState={{ expanded: help }}
        >
          <Icon
            name="help"
            size={19}
            color={help ? colors.navy : colors.tertiary}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>
      {help ? (
        <Animated.Text entering={FadeIn.duration(200)} style={styles.help}>
          {measure ??
            'Measure the widest point, usually wheel to wheel. It’s often on a label under the seat.'}
        </Animated.Text>
      ) : null}
      <View
        style={styles.stepper}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${fmtLimit(value)} inches` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={e =>
          nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)
        }
      >
        <StepButton
          glyph="−"
          onPress={() => nudge(-1)}
          disabled={value <= 16}
        />
        <Text style={styles.value}>
          {fmtLimit(value)}
          <Text style={styles.unit}> in</Text>
        </Text>
        <StepButton glyph="+" onPress={() => nudge(1)} disabled={value >= 40} />
      </View>
    </View>
  );
}

function StepButton({
  glyph,
  onPress,
  disabled,
}: {
  glyph: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      importantForAccessibility="no"
      accessibilityElementsHidden
      style={({ pressed }) => [
        styles.step,
        pressed && styles.stepPressed,
        disabled && styles.stepOff,
      ]}
    >
      <Text style={[styles.stepGlyph, disabled && styles.stepGlyphOff]}>
        {glyph}
      </Text>
    </Pressable>
  );
}

/** The survey's Level line, tilted as the slope: exaggerated the same way (1% ≈ 2°) so a few percent shows. */
function SlopeLine({ percent, on }: { percent: number; on: boolean }) {
  return (
    <View style={styles.slope}>
      <View
        style={[
          styles.slopeLine,
          on && styles.slopeLineOn,
          { transform: [{ rotate: `${-percent * 2}deg` }] },
        ]}
      />
    </View>
  );
}
