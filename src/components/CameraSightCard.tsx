import type { useCameraSight } from '@/hooks/useCameraSight';
import type { LockedSight, MarkerHeight } from '@/utils/sightSlope';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { oneWayGrade } from '@/utils/sightSlope';

type CameraSightCardProps = {
  /** True while a trail profile records, so the sight is placed on it. */
  canSaveToTrail: boolean;
  onSaveToTrail: (gradePercent: number) => void;
  sight: ReturnType<typeof useCameraSight>;
};

const MARKER_OPTIONS: { label: string; value: MarkerHeight }[] = [
  { label: 'Marker at phone height', value: 'phone' },
  { label: 'Marker on the ground', value: 'ground' },
];

function formatSignedGrade(percent: number) {
  return `${percent >= 0 ? '+' : '−'}${Math.abs(percent).toFixed(1)}%`;
}

function formatAngle(degrees: number) {
  return `${degrees >= 0 ? '+' : '−'}${Math.abs(degrees).toFixed(2)}°`;
}

function describeSight(label: string, sight: LockedSight | null) {
  if (!sight) return `${label}: not taken`;
  return `${label}: ${formatAngle(sight.elevationDegrees)} (±${sight.spreadDegrees.toFixed(2)}° wobble)`;
}

export default function CameraSightCard({
  canSaveToTrail,
  onSaveToTrail,
  sight,
}: CameraSightCardProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isSaving, setIsSaving] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { back, fore, live, locking, result } = sight;

  const liveGrade =
    live && live.usable
      ? oneWayGrade(
          {
            elevationDegrees: live.elevationDegrees,
            sampleCount: 1,
            spreadDegrees: 0,
          },
          sight.offsetDegrees,
        ).gradePercent
      : null;

  async function toggle() {
    if (sight.isActive) {
      sight.stop();
      return;
    }
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) return;
    }
    setCameraError(null);
    await sight.start();
  }

  async function save() {
    if (!result) return;
    setIsSaving(true);
    try {
      await sight.saveResult();
      if (canSaveToTrail) onSaveToTrail(Math.abs(result.gradePercent));
    } finally {
      setIsSaving(false);
    }
  }

  const cameraDenied =
    permission && !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Camera sight
      </Text>
      <Text style={styles.instructions}>
        Measures running slope with the phone in your hand. Hold it upright and
        put the crosshair on a marker up the trail. For a number you can trust,
        take a two-way sight: lock a fore sight, walk to the marker, then sight
        back at an identical marker you left where you stood. The two sights
        cancel the phone&apos;s own angle error.
      </Text>

      <View accessibilityRole="radiogroup" style={styles.segment}>
        {MARKER_OPTIONS.map(option => {
          const selected = sight.markerHeight === option.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => sight.setMarkerHeight(option.value)}
              style={[styles.segmentItem, selected && styles.segmentSelected]}
            >
              <Text
                style={[
                  styles.segmentText,
                  selected && styles.segmentTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.message}>
        {sight.markerHeight === 'phone'
          ? 'Use a partner at your eye level, or a pole with a mark at the height you hold the phone.'
          : 'Working alone: drop a backpack or cone where you stand, and aim at an identical one on the trail ahead.'}
      </Text>

      <Pressable
        accessibilityRole="button"
        disabled={Boolean(cameraDenied)}
        onPress={() => void toggle()}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Text style={styles.toggleText}>
          {sight.isActive ? 'Turn off camera sight' : 'Turn on camera sight'}
        </Text>
      </Pressable>
      {cameraDenied && (
        <Text style={styles.blocker}>
          Camera access is off for this app. Turn it on in Settings to sight.
        </Text>
      )}

      {sight.isActive && (
        <>
          <View style={styles.cameraFrame}>
            <CameraView
              active
              facing="back"
              onMountError={event => setCameraError(event.message)}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.crosshair}>
              <View style={styles.crosshairHorizontal} />
              <View style={styles.crosshairVertical} />
              <View style={styles.crosshairRing} />
            </View>
            <View
              accessibilityLiveRegion="polite"
              pointerEvents="none"
              style={styles.overlay}
            >
              <Text style={styles.overlayValue}>
                {live
                  ? live.usable
                    ? formatAngle(live.elevationDegrees)
                    : 'Hold the phone upright'
                  : '—'}
              </Text>
              {liveGrade !== null && (
                <Text style={styles.overlayDetail}>
                  One-way {formatSignedGrade(liveGrade)}
                  {sight.offsetDegrees === null ? ' (uncalibrated)' : ''}
                </Text>
              )}
              <Text
                style={[
                  styles.overlayDetail,
                  live?.steady ? styles.steady : styles.unsteady,
                ]}
              >
                {live?.steady ? 'Steady' : 'Settling…'}
              </Text>
            </View>
          </View>
          {cameraError && (
            <Text style={styles.blocker}>
              The camera preview could not start: {cameraError}
            </Text>
          )}

          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: locking === 'fore' }}
              disabled={locking !== null}
              onPress={() => sight.lock('fore')}
              style={({ pressed }) => [
                styles.action,
                (pressed || locking !== null) && styles.pressed,
              ]}
            >
              {locking === 'fore' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionText}>
                  {fore ? 'Redo fore sight' : '1. Lock fore sight'}
                </Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                busy: locking === 'back',
                disabled: !fore || locking !== null,
              }}
              disabled={!fore || locking !== null}
              onPress={() => sight.lock('back')}
              style={({ pressed }) => [
                styles.action,
                (pressed || !fore || locking !== null) && styles.pressed,
              ]}
            >
              {locking === 'back' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionText}>
                  {back ? 'Redo back sight' : '2. Lock back sight'}
                </Text>
              )}
            </Pressable>
          </View>
          <Text style={styles.message}>
            {describeSight('Fore sight', fore)}
          </Text>
          <Text style={styles.message}>
            {describeSight('Back sight', back)}
          </Text>
        </>
      )}

      {sight.message && (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {sight.message}
        </Text>
      )}

      {result && (
        <View
          accessible
          accessibilityLabel={`Two-way grade ${result.gradePercent.toFixed(1)} percent, plus or minus ${result.uncertaintyPercent.toFixed(1)}`}
          style={styles.result}
        >
          <Text style={styles.resultNumber}>
            {formatSignedGrade(result.gradePercent)}
            <Text style={styles.resultUncertainty}>
              {' '}
              ± {result.uncertaintyPercent.toFixed(1)}
            </Text>
          </Text>
          <Text style={styles.message}>
            Two-way running slope between the stations,{' '}
            {result.gradePercent >= 0 ? 'uphill' : 'downhill'} from the first
            station.
            {result.offsetDegrees !== null
              ? ` Phone angle offset: ${formatAngle(result.offsetDegrees)}.`
              : ''}
          </Text>
          {result.warnings.map(warning => (
            <Text key={warning} style={styles.blocker}>
              {warning}
            </Text>
          ))}
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void save()}
              style={({ pressed }) => [
                styles.action,
                (pressed || isSaving) && styles.pressed,
              ]}
            >
              <Text style={styles.actionText}>
                {canSaveToTrail ? 'Save sight to trail' : 'Save sight'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={sight.reset}
              style={({ pressed }) => [
                styles.toggle,
                styles.flex,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.toggleText}>New sight</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.message}>
        {sight.savedCount} sight{sight.savedCount === 1 ? '' : 's'} saved on
        this device.
        {canSaveToTrail
          ? ' Saved sights are also placed on the trail being recorded.'
          : ' Start a trail profile to also place sights along the trail.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  title: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '700',
  },
  instructions: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  segment: {
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 3,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 6,
  },
  segmentSelected: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: '#101828',
  },
  toggle: {
    alignItems: 'center',
    borderColor: '#344054',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  toggleText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '700',
  },
  cameraFrame: {
    backgroundColor: '#101828',
    borderRadius: 12,
    height: 320,
    overflow: 'hidden',
  },
  crosshair: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairHorizontal: {
    backgroundColor: '#FFFFFF',
    height: 1,
    opacity: 0.9,
    position: 'absolute',
    width: '100%',
  },
  crosshairVertical: {
    backgroundColor: '#FFFFFF',
    height: 60,
    opacity: 0.9,
    position: 'absolute',
    width: 1,
  },
  crosshairRing: {
    borderColor: '#F04438',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    position: 'absolute',
    width: 24,
  },
  overlay: {
    backgroundColor: 'rgba(16, 24, 40, 0.7)',
    borderRadius: 8,
    bottom: 10,
    left: 10,
    padding: 8,
    position: 'absolute',
  },
  overlayValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  overlayDetail: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  steady: {
    color: '#6CE9A6',
  },
  unsteady: {
    color: '#FEC84B',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  action: {
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  result: {
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    gap: 8,
    padding: 12,
  },
  resultNumber: {
    color: '#101828',
    fontSize: 32,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  resultUncertainty: {
    color: '#475467',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  blocker: {
    backgroundColor: '#FFFAEB',
    borderColor: '#FEC84B',
    borderRadius: 10,
    borderWidth: 1,
    color: '#93370D',
    fontSize: 14,
    lineHeight: 20,
    padding: 10,
  },
  pressed: {
    opacity: 0.5,
  },
});
