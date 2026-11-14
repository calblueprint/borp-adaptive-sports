// Prototype stand-in for the iOS "Allow … to use your location?" alert, so the flow can be shown
// without real GPS (see FAKE_LOCATION in src/state/location.tsx). Opened by locateMe(); the answer
// goes back through answerPrompt(). Not a Figma screen: it mirrors the system alert.
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { useLocation } from '@/features/trails/LocationProvider';
import { colors, ios } from '@/styles/theme';
import styles from './styles';

// Same wording as the real prompt (app.json › expo-location › locationWhenInUsePermission)
const REASON =
  'BORP uses your location to show the trails closest to you and to pin new trailheads.';

// iOS alerts pop in slightly large and settle
const popIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 1.12 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(220);

const close = () =>
  router.canGoBack() ? router.back() : router.replace('/prototype/trails');

export default function LocationAccessScreen() {
  const { answerPrompt } = useLocation();

  // Closed some other way (e.g. Android back): treat as not answered
  useEffect(() => () => answerPrompt(null), [answerPrompt]);

  const answer = (allowed: boolean) => {
    answerPrompt(allowed);
    close();
  };

  return (
    <View style={styles.backdrop}>
      <Animated.View
        entering={popIn}
        style={styles.alert}
        accessibilityViewIsModal
        accessibilityRole="alert"
      >
        <View style={styles.copy}>
          <Text style={styles.title}>Allow “Borp” to use your location?</Text>
          <Text style={styles.message}>{REASON}</Text>
        </View>

        <MiniMap />

        <View style={styles.buttons}>
          <AlertButton label="Allow Once" onPress={() => answer(true)} />
          <AlertButton
            label="Allow While Using App"
            onPress={() => answer(true)}
          />
          <AlertButton label="Don’t Allow" onPress={() => answer(false)} />
        </View>
      </Animated.View>
    </View>
  );
}

function AlertButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

/** A plain street map with the blue "you are here" dot, like the preview in the system alert. */
function MiniMap() {
  return (
    <View
      style={styles.map}
      accessible
      accessibilityLabel="Map preview of your approximate location"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 240 120"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect width={240} height={120} fill={ios.mapLand} />
        <Path
          d="M0 40 C60 34 120 50 240 30"
          stroke={colors.white}
          strokeWidth={7}
          fill="none"
        />
        <Path
          d="M0 92 L240 78"
          stroke={colors.white}
          strokeWidth={5}
          fill="none"
        />
        <Path
          d="M70 0 L92 120"
          stroke={colors.white}
          strokeWidth={5}
          fill="none"
        />
        <Path
          d="M168 0 C160 40 176 80 160 120"
          stroke={ios.mapHighway}
          strokeWidth={8}
          fill="none"
        />
        <Path
          d="M20 0 L30 120M130 0 L120 120M210 0 L216 120"
          stroke={colors.white}
          strokeWidth={3}
          fill="none"
        />
        <Rect x={182} y={46} width={44} height={24} rx={6} fill={ios.mapPark} />
        <Circle cx={124} cy={62} r={22} fill={ios.blue} opacity={0.14} />
        <Circle cx={124} cy={62} r={8} fill={colors.white} />
        <Circle cx={124} cy={62} r={5.5} fill={ios.blue} />
      </Svg>
      <View style={styles.precise}>
        <Svg width={10} height={10} viewBox="0 0 24 24">
          <Path d="M20.5 3.5 3.5 10.6l7.4 2.5 2.5 7.4z" fill={ios.blue} />
        </Svg>
        <Text style={styles.preciseText}>Precise: On</Text>
      </View>
    </View>
  );
}
