import type { SlopeLevelReading } from '@/hooks/useSlopeLevel';
import type { LevelReading } from '@/utils/trail';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SlopeLevelCardProps = {
  canSave: boolean;
  isActive: boolean;
  message: string | null;
  onSave: (reading: SlopeLevelReading) => void;
  onToggle: () => void;
  reading: SlopeLevelReading | null;
  savedReadings: LevelReading[];
};

export default function SlopeLevelCard({
  canSave,
  isActive,
  message,
  onSave,
  onToggle,
  reading,
  savedReadings,
}: SlopeLevelCardProps) {
  const saveEnabled = canSave && reading !== null && reading.steady;
  const saveBlockedHint = !canSave
    ? 'Start a trail profile to save readings.'
    : !reading?.steady
      ? 'Waits for a steady reading.'
      : undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Slope level</Text>
      <Text style={styles.instructions}>
        For cross slope and short steep pitches. Lay the phone flat on the
        trail, top of the phone pointing along the trail, and wait for a steady
        reading.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Text style={styles.toggleText}>
          {isActive ? 'Turn off level' : 'Turn on level'}
        </Text>
      </Pressable>

      {isActive && (
        <View
          accessible
          accessibilityLabel={
            reading
              ? `Running slope ${reading.runningSlopePercent.toFixed(1)} percent, cross slope ${reading.crossSlopePercent.toFixed(1)} percent`
              : (message ?? 'Waiting for level reading')
          }
          accessibilityLiveRegion="polite"
          style={styles.readout}
        >
          <View style={styles.value}>
            <Text style={styles.valueNumber}>
              {reading ? `${reading.runningSlopePercent.toFixed(1)}%` : '—'}
            </Text>
            <Text style={styles.valueLabel}>Running slope</Text>
          </View>
          <View style={styles.value}>
            <Text style={styles.valueNumber}>
              {reading ? `${reading.crossSlopePercent.toFixed(1)}%` : '—'}
            </Text>
            <Text style={styles.valueLabel}>Cross slope</Text>
          </View>
        </View>
      )}
      {isActive && message && <Text style={styles.message}>{message}</Text>}

      {isActive && !canSave && (
        <Text style={styles.blocker}>
          Saving needs a trail profile to be recording, so each reading is
          placed along the trail. Tap Start trail profile above, then save here.
        </Text>
      )}
      {isActive && (
        <Pressable
          accessibilityHint={saveBlockedHint}
          accessibilityRole="button"
          accessibilityState={{ disabled: !saveEnabled }}
          disabled={!saveEnabled}
          onPress={() => reading && onSave(reading)}
          style={({ pressed }) => [
            styles.save,
            (!saveEnabled || pressed) && styles.pressed,
          ]}
        >
          <Text style={styles.saveText}>Save reading at this spot</Text>
        </Pressable>
      )}
      {savedReadings.length > 0 && (
        <Text style={styles.message}>
          {savedReadings.length} level reading
          {savedReadings.length === 1 ? '' : 's'} saved with this trail.
        </Text>
      )}
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
  readout: {
    flexDirection: 'row',
    gap: 12,
  },
  value: {
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    flex: 1,
    padding: 12,
  },
  valueNumber: {
    color: '#101828',
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  valueLabel: {
    color: '#667085',
    fontSize: 13,
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
  save: {
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 46,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.5,
  },
});
