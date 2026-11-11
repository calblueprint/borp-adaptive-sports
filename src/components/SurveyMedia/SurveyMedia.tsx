// Real photos and voice notes for pins: the system camera (expo-image-picker) and the mic (expo-audio).
// Both work in Expo Go. Files stay in the app's cache here; the real app would move them into app storage
// so they survive until the survey uploads.

import type { Photo, VoiceNote } from '@/features/survey/SurveyProvider';
import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/components/Icon/Icon';
import { surveyStyles } from '@/components/SurveyLayout/SurveyLayout';
import { formatElapsed } from '@/features/survey/SurveyProvider';
import XSmall from '@/icons/x-small.svg';
import { colors } from '@/styles/theme';
import styles from './styles';

/** Anything shorter is treated as a slip of the thumb, not a note. */
const MIN_NOTE_MS = 700;

/* ---------- Photos ---------- */

function openSettings(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

/** Opens the camera; falls back to the photo library where there's no camera (simulator, web). */
export async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    openSettings(
      'Camera is off',
      'Allow camera access in Settings to add photos to your survey.',
    );
    return null;
  }
  try {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.6,
    });
    return res.canceled ? null : res.assets[0].uri;
  } catch {
    return pickPhoto();
  }
}

export async function pickPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.6,
  });
  return res.canceled ? null : res.assets[0].uri;
}

export function PhotoThumb({
  uri,
  size = 64,
  onRemove,
}: {
  uri: Photo;
  size?: number;
  onRemove?: () => void;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={typeof uri === 'string' ? { uri } : uri}
        style={[styles.thumb, { width: size, height: size }]}
        accessibilityLabel="Photo"
        accessibilityIgnoresInvertColors
      />
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          style={styles.thumbRemove}
        >
          <XSmall width={12} height={12} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Recording ---------- */

type RecordingState = { recording: boolean; ms: number };

/**
 * Tap to record, tap again to save. Wraps any button: `children` gets the live state so the button can
 * show "0:04" and a stop square. Holding was hard with gloves or an unsteady hand, and a slip of the thumb
 * cut the note short. Saves through `onNote`; leaving the screen mid-note saves it too.
 */
export function TapToRecord({
  onNote,
  onStateChange,
  label,
  style,
  children,
}: {
  onNote: (note: VoiceNote) => void;
  /** For showing a recording banner elsewhere on screen. */
  onStateChange?: (s: RecordingState) => void;
  label: string;
  style?: PressableProps['style'];
  children: (s: RecordingState) => ReactNode;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const status = useAudioRecorderState(recorder, 200);
  const starting = useRef<Promise<boolean> | null>(null);
  const startedAt = useRef(0);
  const [on, setOn] = useState(false);
  const recording = on && status.isRecording;
  const ms = recording ? status.durationMillis : 0;

  useEffect(() => {
    onStateChange?.({ recording, ms });
  }, [recording, ms, onStateChange]);

  async function start() {
    let perm = await getRecordingPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        openSettings(
          'Microphone is off',
          'Allow microphone access in Settings to leave voice notes.',
        );
        return false;
      }
      perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return false;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    startedAt.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return true;
  }

  async function stop() {
    const started = await starting.current;
    starting.current = null;
    if (!started) return;
    await recorder.stop();
    // Back to the speaker for playback (iOS routes to the earpiece while recording is allowed)
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    const length = Date.now() - startedAt.current;
    // A double tap isn't a note; drop it quietly
    if (length < MIN_NOTE_MS || !recorder.uri) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNote({ uri: recorder.uri, ms: length });
  }

  // Leaving mid-note (Pause, Back) keeps what was said
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });
  useEffect(() => () => void (starting.current && stopRef.current()), []);

  function toggle() {
    if (starting.current) {
      setOn(false);
      stop();
      return;
    }
    setOn(true);
    starting.current = start()
      .catch(() => false)
      .then(ok => {
        if (!ok) {
          setOn(false);
          starting.current = null;
        }
        return ok;
      });
  }

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={
        recording ? `Stop recording, ${formatElapsed(ms)}` : label
      }
      accessibilityHint={
        recording
          ? 'Saves the voice note'
          : 'Starts recording; tap again to save'
      }
      accessibilityState={{ selected: recording }}
      style={style}
    >
      {children({ recording, ms })}
    </Pressable>
  );
}

/** Stop glyph for a recording mic button: a rounded white square, like Voice Memos. */
export function StopSquare({
  size = 16,
  color = colors.white,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundColor: color,
      }}
    />
  );
}

/** Pulsing red dot for "recording". */
export function RecDot({ size = 9 }: { size?: number }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.recording,
        },
        style,
      ]}
    />
  );
}

/* ---------- Playback ---------- */

export function VoiceNoteRow({
  note,
  index,
  onRemove,
}: {
  note: VoiceNote;
  index: number;
  onRemove?: () => void;
}) {
  const player = useAudioPlayer({ uri: note.uri });
  const status = useAudioPlayerStatus(player);
  const total = status.duration || note.ms / 1000;
  const progress = total ? Math.min(1, status.currentTime / total) : 0;

  function toggle() {
    if (status.playing) return player.pause();
    if (status.didJustFinish || status.currentTime >= total - 0.05)
      player.seekTo(0);
    player.play();
  }

  return (
    <View style={styles.note}>
      <Pressable
        onPress={toggle}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${status.playing ? 'Pause' : 'Play'} voice note ${index + 1}`}
        style={({ pressed }) => [styles.play, pressed && surveyStyles.pressed]}
      >
        <Icon
          name={status.playing ? 'pause' : 'play'}
          size={16}
          color={colors.white}
          strokeWidth={2.2}
        />
      </Pressable>
      <View style={styles.noteTrack}>
        <View style={[styles.noteFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.noteTime}>
        {formatElapsed(status.playing ? status.currentTime * 1000 : note.ms)}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Delete voice note ${index + 1}`}
        >
          <XSmall color={colors.stone} />
        </Pressable>
      ) : null}
    </View>
  );
}
