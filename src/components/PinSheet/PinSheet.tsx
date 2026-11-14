// Drop-pin steps, shown inside the session's bottom sheet so the dropped pin stays visible on the map:
// 1. What's here?  2. Measure (against the guideline, with a how-to)  3. Photo / voice / note, then Save.
// Tapping a pin on the map opens PinView. Not in Figma yet; styled like the other survey screens.

import type { IconName } from '@/components/Icon/Icon';
import type { PinKind, PinKindInfo } from '@/data/survey';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Chips } from '@/components/Chips/Chips';
import { GuidelineMark } from '@/components/GuidelineMark/GuidelineMark';
import { Icon } from '@/components/Icon/Icon';
import { surveyStyles } from '@/components/SurveyLayout/SurveyLayout';
import {
  PhotoThumb,
  pickPhoto,
  RecDot,
  StopSquare,
  takePhoto,
  TapToRecord,
  VoiceNoteRow,
} from '@/components/SurveyMedia/SurveyMedia';
import { formatPinValue, PIN_KINDS, pinKind, pinMark } from '@/data/survey';
import { type Pin } from '@/features/survey/SurveyProvider';
import CheckCircle from '@/icons/check-circle.svg';
import XSmall from '@/icons/x-small.svg';
import { colors, spring } from '@/styles/theme';
import styles, { PLACEHOLDER } from './styles';

/* ---------- Keyboard ---------- */

/** Height of the on-screen keyboard, so the sheet can ride above it. */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/* ---------- Frame: header, scrolling body, pinned footer ---------- */

function Step({
  title,
  subtitle,
  onBack,
  onClose,
  closeLabel = 'Close',
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  closeLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  // Leave the top of the map (and the dropped pin) showing
  const maxBody = Math.max(
    140,
    height - keyboard - insets.top - (keyboard ? 230 : 330),
  );
  return (
    <View style={styles.step}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.headerBtn,
              pressed && surveyStyles.pressed,
            ]}
          >
            <Icon name="back" size={18} color={colors.ink} strokeWidth={2} />
          </Pressable>
        ) : null}
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onClose ? (
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            style={({ pressed }) => [
              styles.headerBtn,
              pressed && surveyStyles.pressed,
            ]}
          >
            <XSmall width={14} height={14} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        style={{ maxHeight: maxBody }}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const pinPlace = (pin: Pin) => `Pin ${pin.n} · ${pin.mi.toFixed(2)} mi in`;

/* ---------- 1. What's here? ---------- */

export function KindStep({
  pin,
  onPick,
  onClose,
}: {
  pin: Pin;
  onPick: (k: PinKind) => void;
  onClose: () => void;
}) {
  return (
    <Step
      title="What’s here?"
      subtitle={pinPlace(pin)}
      onClose={onClose}
      closeLabel="Cancel pin"
    >
      <View style={styles.grid}>
        {PIN_KINDS.map(k => {
          const on = pin.kind === k.key;
          return (
            <Pressable
              key={k.key}
              onPress={() => {
                Haptics.selectionAsync();
                onPick(k.key);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${k.label}. ${k.hint}`}
              style={({ pressed }) => [
                styles.tile,
                on && styles.tileOn,
                pressed && surveyStyles.pressed,
              ]}
            >
              {/* The glyph and name say it; the hint is for the screen reader */}
              <Icon
                name={k.icon}
                size={24}
                color={colors.ink}
                strokeWidth={1.7}
              />
              <Text style={styles.tileLabel} numberOfLines={2}>
                {k.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Step>
  );
}

/* ---------- 2. Measure ---------- */

export function MeasureStep({
  pin,
  lastTime,
  onChange,
  onBack,
  onNext,
}: {
  pin: Pin;
  /** What the last survey recorded for this, when it flagged it. */
  lastTime?: string;
  onChange: (patch: Partial<Pin>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const k = pinKind(pin.kind!);
  const [help, setHelp] = useState(false);
  const mark = pinMark(pin);
  const measured =
    k.measure === 'none' ? !!pin.choice || !k.choices : pin.value !== undefined;
  const skip = () => {
    onChange({ value: undefined });
    onNext();
  };

  return (
    <Step
      title={k.question}
      subtitle={`${k.label} · ${pinPlace(pin)}`}
      onBack={onBack}
      footer={
        <>
          <ActionButton
            label="Next"
            disabled={!measured}
            onPress={onNext}
            style={styles.mainButton}
          />
          {k.measure !== 'none' ? (
            <Pressable
              onPress={skip}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.quiet,
                pressed && surveyStyles.pressed,
              ]}
            >
              <Text style={styles.quietText}>Couldn’t measure</Text>
            </Pressable>
          ) : null}
        </>
      }
    >
      {k.guideline || lastTime ? (
        <View style={styles.context}>
          {k.guideline ? (
            <View style={styles.guideLine}>
              <Text style={styles.guideText}>
                Guideline <Text style={styles.guideStrong}>{k.guideline}</Text>
              </Text>
              {mark ? <Verdict mark={mark} fails={k.fails} /> : null}
            </View>
          ) : null}
          {lastTime ? (
            <Text style={styles.guideText}>Last time {lastTime}</Text>
          ) : null}
        </View>
      ) : null}

      {k.choices ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{k.choiceLabel}</Text>
          <Chips
            options={k.choices.map(c => c.label)}
            value={pin.choice}
            onChange={choice => onChange({ choice })}
            label={k.choiceLabel ?? k.label}
          />
        </View>
      ) : null}
      {k.measure === 'inches' ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            {k.key === 'obstacle' ? 'Height' : 'Width'}
          </Text>
          <Stepper
            value={pin.value}
            start={k.start ?? 0}
            onChange={value => onChange({ value })}
            label={
              k.key === 'obstacle' ? 'Height in inches' : 'Width in inches'
            }
          />
        </View>
      ) : null}
      {k.measure === 'level' ? (
        <LevelReader
          kind={k}
          value={pin.value}
          onChange={value => onChange({ value })}
        />
      ) : null}

      <View>
        <Pressable
          onPress={() => setHelp(h => !h)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ expanded: help }}
          style={styles.inline}
        >
          <Icon name="help" size={18} color={colors.navy} />
          <Text style={surveyStyles.link}>
            {help ? 'Hide how to measure' : 'How to measure'}
          </Text>
        </Pressable>
        {help ? <Text style={styles.help}>{k.howTo}</Text> : null}
      </View>
    </Step>
  );
}

/** Live verdict as you measure: a check and "Meets it", or the words for how it misses (navy). Never a coloured pill. */
function Verdict({ mark, fails }: { mark: 'ok' | 'warn'; fails?: string }) {
  const ok = mark === 'ok';
  return (
    <View style={styles.verdict} accessibilityLiveRegion="polite">
      <GuidelineMark mark={mark} />
      <Text style={styles.verdictText}>
        {ok ? 'Meets it' : (fails ?? 'Check this')}
      </Text>
    </View>
  );
}

/** − [ 34 ] in + — type it, or nudge it with gloves on. */
function Stepper({
  value,
  start,
  onChange,
  label,
}: {
  value?: number;
  start: number;
  onChange: (v: number | undefined) => void;
  label: string;
}) {
  // Keep what they typed ("3." mid-entry) unless the value changed from elsewhere (−/+, Couldn't measure)
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const shown =
    (text === '' ? undefined : Number(text)) === value
      ? text
      : value === undefined
        ? ''
        : String(value);
  const nudge = (d: number) => {
    Haptics.selectionAsync();
    onChange(Math.max(0, (value ?? start) + (value === undefined ? 0 : d)));
  };
  return (
    <View style={styles.stepper}>
      <StepButton icon="−" label="Less" onPress={() => nudge(-1)} />
      <View style={styles.stepValue}>
        <TextInput
          value={shown}
          onChangeText={t => {
            const clean = t.replace(/[^0-9.]/g, '');
            setText(clean);
            onChange(
              clean === '' || isNaN(Number(clean)) ? undefined : Number(clean),
            );
          }}
          placeholder={String(start)}
          placeholderTextColor={PLACEHOLDER}
          keyboardType="decimal-pad"
          returnKeyType="done"
          maxLength={5}
          accessibilityLabel={label}
          style={styles.stepInput}
        />
        <Text style={styles.stepUnit}>in</Text>
      </View>
      <StepButton icon="+" label="More" onPress={() => nudge(1)} />
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.stepBtn, pressed && surveyStyles.pressed]}
    >
      <Text style={styles.stepBtnText}>{icon}</Text>
    </Pressable>
  );
}

/**
 * "Lay your phone on the path" slope reading. MOCKED for the prototype: it wobbles for a couple of seconds
 * and settles on a made-up number. The real app would read the phone's tilt (expo-sensors DeviceMotion).
 */
function LevelReader({
  kind,
  value,
  onChange,
}: {
  kind: PinKindInfo;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [reading, setReading] = useState(false);
  const [live, setLive] = useState(0);
  const tilt = useSharedValue(value ?? 0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  function read() {
    // Grade readings land between 2 and 9%, cross slopes between 0.5 and 6.5%, so both verdicts show up
    const target =
      Math.round(
        (kind.key === 'grade'
          ? 2 + Math.random() * 7
          : 0.5 + Math.random() * 6) * 10,
      ) / 10;
    setReading(true);
    onChange(undefined);
    tilt.value = withRepeat(
      withSequence(
        withTiming(target + 3, { duration: 220 }),
        withTiming(target - 2, { duration: 260 }),
      ),
      4,
      true,
    );
    const started = Date.now();
    timer.current = setInterval(() => {
      const t = (Date.now() - started) / 2200;
      if (t >= 1) {
        clearInterval(timer.current!);
        timer.current = null;
        cancelAnimation(tilt);
        tilt.value = withSpring(target, spring.pop);
        setReading(false);
        onChange(target);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      // Jitter that narrows in on the target
      setLive(Math.max(0, target + (Math.random() - 0.5) * 6 * (1 - t)));
    }, 90);
  }

  // Like Apple's Level: one thick black line that tilts with the path. Exaggerated so a few percent is
  // visible (1% ≈ 2°); uphill lifts its right end.
  const line = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-Math.max(-20, Math.min(20, tilt.value * 2))}deg` },
    ],
  }));
  const shown = reading ? live : value;

  return (
    <View style={styles.level}>
      {/* Before a reading, a greyed 0.0% (like a field's placeholder) shows where the number lands */}
      <Text
        style={[styles.levelValue, shown === undefined && styles.levelEmpty]}
        accessibilityLabel={
          shown === undefined ? 'No reading yet' : `${shown.toFixed(1)} percent`
        }
        accessibilityLiveRegion="polite"
      >
        {(shown ?? 0).toFixed(1)}
        <Text
          style={[styles.levelUnit, shown === undefined && styles.levelEmpty]}
        >
          %
        </Text>
      </Text>
      <View
        style={styles.levelStage}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Animated.View style={[styles.levelLine, line]} />
      </View>
      <Text style={[surveyStyles.faint, styles.center]}>
        {reading
          ? 'Hold still…'
          : kind.key === 'grade'
            ? 'Phone pointing uphill'
            : 'Phone across the path'}
      </Text>
      <ActionButton
        label={
          reading
            ? 'Reading…'
            : value === undefined
              ? 'Read slope'
              : 'Read again'
        }
        variant="soft"
        icon={<Icon name="level" size={20} color={colors.ink} />}
        disabled={reading}
        onPress={read}
        style={styles.levelBtn}
      />
    </View>
  );
}

/* ---------- 3. Photo, voice, note ---------- */

export function EvidenceStep({
  pin,
  onChange,
  onBack,
  onSave,
}: {
  pin: Pin;
  onChange: (patch: Partial<Pin>) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const [rec, setRec] = useState({ recording: false, ms: 0 });
  const addPhoto = async (from: 'camera' | 'library') => {
    const uri = from === 'camera' ? await takePhoto() : await pickPhoto();
    if (uri) onChange({ photos: [...pin.photos, uri] });
  };
  return (
    <Step
      title="Show what you saw"
      subtitle={`${pin.kind ? pinKind(pin.kind).label : 'Pin'}: ${formatPinValue(pin)} · optional`}
      onBack={onBack}
      footer={
        <ActionButton
          label="Save pin"
          disabled={rec.recording}
          onPress={onSave}
          accessibilityHint={
            rec.recording ? 'Stop the voice note first' : undefined
          }
          style={styles.mainButton}
        />
      }
    >
      {/* Three equal ways in: camera, library, voice */}
      <View style={styles.capture}>
        <CaptureTile
          icon="camera"
          label="Take photo"
          onPress={() => addPhoto('camera')}
        />
        <CaptureTile
          icon="image"
          label="Library"
          accessibilityLabel="Choose from library"
          onPress={() => addPhoto('library')}
        />
        <TapToRecord
          label="Record voice note"
          onNote={note => onChange({ voice: [...pin.voice, note] })}
          onStateChange={setRec}
          style={({ pressed }) => [
            styles.captureTile,
            rec.recording && styles.captureTileRec,
            pressed && surveyStyles.pressed,
          ]}
        >
          {({ recording, ms }) =>
            recording ? (
              <>
                <View style={styles.stopDot}>
                  <StopSquare size={12} />
                </View>
                <View style={styles.inline}>
                  <RecDot size={7} />
                  <Text style={[styles.captureLabel, styles.recLabel]}>
                    {formatMs(ms)}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Icon
                  name="mic"
                  size={26}
                  color={colors.ink}
                  strokeWidth={1.7}
                />
                <Text style={styles.captureLabel}>Voice note</Text>
              </>
            )
          }
        </TapToRecord>
      </View>

      {pin.photos.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {pin.photos.map((uri, i) => (
            <PhotoThumb
              key={typeof uri === 'string' ? uri : i}
              uri={uri}
              onRemove={() =>
                onChange({ photos: pin.photos.filter((_, j) => j !== i) })
              }
            />
          ))}
        </ScrollView>
      ) : null}
      {pin.voice.length ? (
        <View style={styles.notes}>
          {pin.voice.map((v, i) => (
            <VoiceNoteRow
              key={v.uri}
              note={v}
              index={i}
              onRemove={() =>
                onChange({ voice: pin.voice.filter((_, j) => j !== i) })
              }
            />
          ))}
        </View>
      ) : null}

      <TextInput
        value={pin.note ?? ''}
        onChangeText={note => onChange({ note })}
        placeholder="Add a note"
        placeholderTextColor={colors.muted}
        multiline
        accessibilityLabel="Note"
        style={styles.noteInput}
      />
    </Step>
  );
}

function CaptureTile({
  icon,
  label,
  accessibilityLabel,
  onPress,
}: {
  icon: IconName;
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.captureTile,
        pressed && surveyStyles.pressed,
      ]}
    >
      <Icon name={icon} size={26} color={colors.ink} strokeWidth={1.7} />
      <Text style={styles.captureLabel}>{label}</Text>
    </Pressable>
  );
}

const formatMs = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/* ---------- Tapping a pin on the map ---------- */

export function PinView({
  pin,
  onEdit,
  onDelete,
  onClose,
}: {
  pin: Pin;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const k = pin.kind ? pinKind(pin.kind) : undefined;
  const mark = pinMark(pin);
  const confirmDelete = () =>
    Alert.alert(`Delete pin ${pin.n}?`, 'Its photos and voice notes go too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <Step
      title={`Pin ${pin.n} · ${k?.label ?? 'Voice note'}`}
      subtitle={`${pin.mi.toFixed(2)} mi in`}
      onClose={onClose}
      footer={
        <View style={styles.viewActions}>
          <ActionButton
            label={k ? 'Edit' : 'Add details'}
            variant={k ? 'soft' : 'primary'}
            icon={
              <Icon
                name="edit"
                size={18}
                color={k ? colors.ink : colors.white}
              />
            }
            onPress={onEdit}
            style={
              k
                ? { ...styles.flex, ...styles.mainButton, ...styles.softFill }
                : { ...styles.flex, ...styles.mainButton }
            }
          />
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete pin"
            style={({ pressed }) => [
              styles.trash,
              pressed && surveyStyles.pressed,
            ]}
          >
            <Icon name="trash" size={20} color={colors.error} />
          </Pressable>
        </View>
      }
    >
      {k ? (
        // The reading, set large like the trail page; the guideline and verdict under it
        <View style={styles.reading}>
          <Text style={styles.readingValue}>{formatPinValue(pin)}</Text>
          {k.guideline ? (
            <View style={styles.guideLine}>
              <Text style={styles.guideText}>
                Guideline <Text style={styles.guideStrong}>{k.guideline}</Text>
              </Text>
              {mark ? <Verdict mark={mark} fails={k.fails} /> : null}
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={surveyStyles.meta}>
          Add what it is when you can, or leave it for BORP to listen to.
        </Text>
      )}
      {pin.photos.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {pin.photos.map((uri, i) => (
            <PhotoThumb
              key={typeof uri === 'string' ? uri : i}
              uri={uri}
              size={84}
            />
          ))}
        </ScrollView>
      ) : null}
      {pin.voice.length ? (
        <View style={styles.notes}>
          {pin.voice.map((v, i) => (
            <VoiceNoteRow key={v.uri} note={v} index={i} />
          ))}
        </View>
      ) : null}
      {pin.note ? <Text style={styles.noteText}>{pin.note}</Text> : null}
    </Step>
  );
}

/** Navy check for re-check rows the survey has covered; the row's label already says "checked" to VoiceOver. */
export function Checked() {
  return <CheckCircle width={20} height={20} color={colors.navy} />;
}
