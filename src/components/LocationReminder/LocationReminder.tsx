// The location nudge on the Trails list — not in Figma yet. Until you share a location (or pick a place)
// the list asks for one, since "nearest" and the distances on every card depend on it.
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Icon, LocateOff } from '@/components/Icon/Icon';
import { useLocation } from '@/features/trails/LocationProvider';
import Close from '@/icons/close.svg';
import { colors } from '@/styles/theme';
import styles from './styles';

const pickLocation = () => router.push('/prototype/location');

// Dismissed reminders stay dismissed for the rest of the app session
let reminderDismissed = false;

/** Space the Trails header puts between its blocks; collapsed away with the reminder so nothing jumps. */
const HEADER_GAP = 16;

/**
 * Shown until there's a location to measure from. A nudge, not a gate: the list works without it
 * (distances fall back to Berkeley), so it can be dismissed. Picking a place lives in the "Near …" bar above.
 */
export function LocationReminder() {
  const { origin, permission, locating, locateMe, openSettings } =
    useLocation();
  const [dismissed, setDismissed] = useState(reminderDismissed);
  const reduceMotion = useReducedMotion();
  const height = useSharedValue(0);
  const shown = useSharedValue(1);

  const collapse = useAnimatedStyle(() =>
    shown.value === 1
      ? {}
      : {
          height: height.value * shown.value,
          opacity: shown.value * shown.value,
          marginBottom: -HEADER_GAP * (1 - shown.value),
          overflow: 'hidden',
        },
  );

  if (dismissed) return null;

  const denied = permission === 'denied';
  const turnOn = async () => {
    if ((await (denied ? openSettings() : locateMe())) === 'unavailable')
      pickLocation();
  };
  const dismiss = () => {
    reminderDismissed = true;
    if (reduceMotion) return setDismissed(true);
    shown.value = withTiming(
      0,
      { duration: 260, easing: Easing.out(Easing.cubic) },
      done => done && runOnJS(setDismissed)(true),
    );
  };

  return (
    <Animated.View
      onLayout={e => (height.value = e.nativeEvent.layout.height)}
      accessibilityRole="summary"
      style={[styles.reminder, collapse]}
    >
      <View style={styles.reminderIcon}>
        {denied ? (
          <LocateOff size={20} color={colors.navy} knockout={colors.tint} />
        ) : (
          <Icon name="locate" size={20} color={colors.navy} strokeWidth={1.8} />
        )}
      </View>
      <View style={styles.reminderText}>
        <Text style={styles.reminderTitle}>
          {denied ? 'Location is off' : 'See trails near you'}
        </Text>
        <Text style={styles.reminderBody}>
          Distances are from {origin.label}.
        </Text>
        <Pressable
          onPress={turnOn}
          disabled={locating}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ busy: locating }}
          style={({ pressed }) => [
            styles.reminderButton,
            pressed && styles.reminderButtonPressed,
          ]}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : null}
          <Text style={styles.reminderButtonText}>
            {locating
              ? 'Finding you…'
              : denied
                ? 'Turn on location'
                : 'Use my location'}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={({ pressed }) => [
          styles.reminderClose,
          pressed && styles.pressed,
        ]}
      >
        <Close width={18} height={18} color={colors.secondary} />
      </Pressable>
    </Animated.View>
  );
}
