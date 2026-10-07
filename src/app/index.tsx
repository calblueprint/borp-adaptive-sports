import type { DeviceMotionMeasurement } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAPTURE_STORAGE_KEY = 'offline-gps-captures';
const MAX_STORED_CAPTURES = 20;
const MAX_MOTION_SAMPLES = 1_200;
const MAX_MOTION_SESSIONS = 10;
const MOTION_SAMPLE_INTERVAL_MS = 100;
const MOTION_STORAGE_KEY = 'slope-motion-sessions';

type GpsCapture = {
  accuracy: number | null;
  altitude: number | null;
  capturedAt: string;
  latitude: number;
  longitude: number;
  timeToFixMs: number;
};

type MotionSample = {
  elapsedMs: number;
  gravity: { x: number; y: number; z: number };
  linearAccelerationMagnitude: number | null;
  orientation: number;
  rotation: { alpha: number; beta: number; gamma: number };
  rotationRateMagnitude: number | null;
};

type MotionSession = {
  durationMs: number;
  recordedAt: string;
  samples: MotionSample[];
};

function formatAccuracy(accuracy: number | null) {
  if (accuracy === null) return 'Unavailable';
  return `±${Math.round(accuracy)} m`;
}

function magnitude(x: number, y: number, z: number) {
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
}

function toMotionSample(
  measurement: DeviceMotionMeasurement,
  startedAt: number,
): MotionSample {
  const linearAcceleration = measurement.acceleration;
  const rotationRate = measurement.rotationRate;

  return {
    elapsedMs: Date.now() - startedAt,
    gravity: {
      x: measurement.accelerationIncludingGravity.x,
      y: measurement.accelerationIncludingGravity.y,
      z: measurement.accelerationIncludingGravity.z,
    },
    linearAccelerationMagnitude: linearAcceleration
      ? magnitude(
          linearAcceleration.x,
          linearAcceleration.y,
          linearAcceleration.z,
        )
      : null,
    orientation: measurement.orientation,
    rotation: {
      alpha: measurement.rotation.alpha,
      beta: measurement.rotation.beta,
      gamma: measurement.rotation.gamma,
    },
    rotationRateMagnitude: rotationRate
      ? magnitude(rotationRate.alpha, rotationRate.beta, rotationRate.gamma)
      : null,
  };
}

export default function App() {
  const [capture, setCapture] = useState<GpsCapture | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecordingMotion, setIsRecordingMotion] = useState(false);
  const [latestMotionSample, setLatestMotionSample] =
    useState<MotionSample | null>(null);
  const [lastMotionSession, setLastMotionSession] =
    useState<MotionSession | null>(null);
  const [message, setMessage] = useState('Ready to request a fresh GPS fix.');
  const [motionMessage, setMotionMessage] = useState(
    'Ready to record a slow handheld scan.',
  );
  const [motionSessionCount, setMotionSessionCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const motionSamplesRef = useRef<MotionSample[]>([]);
  const motionStartedAtRef = useRef<number | null>(null);
  const motionSubscriptionRef = useRef<ReturnType<
    typeof DeviceMotion.addListener
  > | null>(null);

  useEffect(() => {
    void loadSavedCount();
    void loadMotionSessionCount();

    return () => motionSubscriptionRef.current?.remove();
  }, []);

  async function loadSavedCount() {
    const storedCaptures = await AsyncStorage.getItem(CAPTURE_STORAGE_KEY);
    if (!storedCaptures) return;

    try {
      const parsedCaptures: unknown = JSON.parse(storedCaptures);
      if (Array.isArray(parsedCaptures)) setSavedCount(parsedCaptures.length);
    } catch {
      setMessage(
        'Saved GPS log could not be read and will be replaced by new captures.',
      );
    }
  }

  async function saveCapture(nextCapture: GpsCapture) {
    const storedCaptures = await AsyncStorage.getItem(CAPTURE_STORAGE_KEY);
    let previousCaptures: GpsCapture[] = [];

    if (storedCaptures) {
      try {
        const parsedCaptures: unknown = JSON.parse(storedCaptures);
        if (Array.isArray(parsedCaptures))
          previousCaptures = parsedCaptures as GpsCapture[];
      } catch {
        previousCaptures = [];
      }
    }

    const updatedCaptures = [nextCapture, ...previousCaptures].slice(
      0,
      MAX_STORED_CAPTURES,
    );
    await AsyncStorage.setItem(
      CAPTURE_STORAGE_KEY,
      JSON.stringify(updatedCaptures),
    );
    setSavedCount(updatedCaptures.length);
  }

  async function loadMotionSessionCount() {
    const storedSessions = await AsyncStorage.getItem(MOTION_STORAGE_KEY);
    if (!storedSessions) return;

    try {
      const parsedSessions: unknown = JSON.parse(storedSessions);
      if (Array.isArray(parsedSessions))
        setMotionSessionCount(parsedSessions.length);
    } catch {
      setMotionMessage(
        'Saved motion scans could not be read. New scans will replace them.',
      );
    }
  }

  async function saveMotionSession(nextSession: MotionSession) {
    const storedSessions = await AsyncStorage.getItem(MOTION_STORAGE_KEY);
    let previousSessions: MotionSession[] = [];

    if (storedSessions) {
      try {
        const parsedSessions: unknown = JSON.parse(storedSessions);
        if (Array.isArray(parsedSessions))
          previousSessions = parsedSessions as MotionSession[];
      } catch {
        previousSessions = [];
      }
    }

    const updatedSessions = [nextSession, ...previousSessions].slice(
      0,
      MAX_MOTION_SESSIONS,
    );
    await AsyncStorage.setItem(
      MOTION_STORAGE_KEY,
      JSON.stringify(updatedSessions),
    );
    setMotionSessionCount(updatedSessions.length);
  }

  async function startMotionRecording() {
    setMotionMessage('Checking motion-sensor availability…');

    try {
      const isAvailable = await DeviceMotion.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Device motion is unavailable on this device.');
      }

      const permission = await DeviceMotion.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Motion permission was not granted.');
      }

      DeviceMotion.setUpdateInterval(MOTION_SAMPLE_INTERVAL_MS);
      motionSamplesRef.current = [];
      motionStartedAtRef.current = Date.now();
      setLatestMotionSample(null);

      motionSubscriptionRef.current = DeviceMotion.addListener(measurement => {
        const startedAt = motionStartedAtRef.current;
        if (!startedAt || motionSamplesRef.current.length >= MAX_MOTION_SAMPLES)
          return;

        const nextSample = toMotionSample(measurement, startedAt);
        motionSamplesRef.current.push(nextSample);
        setLatestMotionSample(nextSample);
      });

      setIsRecordingMotion(true);
      setMotionMessage(
        'Recording motion, hold the phone steady.',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown motion-sensor error.';
      setMotionMessage(`Unable to start motion recording: ${errorMessage}`);
    }
  }

  async function stopMotionRecording() {
    motionSubscriptionRef.current?.remove();
    motionSubscriptionRef.current = null;
    setIsRecordingMotion(false);

    const startedAt = motionStartedAtRef.current;
    const samples = motionSamplesRef.current;
    motionStartedAtRef.current = null;

    if (!startedAt || samples.length === 0) {
      setMotionMessage('No motion samples were recorded. Try a slower scan.');
      return;
    }

    const nextSession: MotionSession = {
      durationMs: Date.now() - startedAt,
      recordedAt: new Date().toISOString(),
      samples,
    };

    try {
      await saveMotionSession(nextSession);
      setLastMotionSession(nextSession);
      setMotionMessage(
        'Motion scan saved locally. These samples will support the camera-based slope test.',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown storage error.';
      setMotionMessage(
        `Motion scan recorded but could not be saved: ${errorMessage}`,
      );
    }
  }

  async function captureLocation() {
    setIsCapturing(true);
    setMessage('Checking Location Services…');

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error(
          'Location Services are off. Try again after enabling them in iPhone Settings.',
        );
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error(
          'Location permission was not granted. Allow Precise Location while using the app.',
        );
      }

      setMessage('Acquiring a fresh high-accuracy location fix…');
      const requestStartedAt = Date.now();
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const nextCapture: GpsCapture = {
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        capturedAt: new Date(location.timestamp).toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timeToFixMs: Date.now() - requestStartedAt,
      };

      setCapture(nextCapture);
      await saveCapture(nextCapture);

      const precisionWarning =
        permission.ios?.accuracy === 'reduced'
          ? ' Precise Location is disabled, so this reading may be approximate.'
          : '';
      setMessage(
        `Fresh location captured and stored on this device.${precisionWarning}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown location error.';
      setMessage(`Unable to capture location: ${errorMessage}`);
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Offline GPS proof</Text>
        <Text style={styles.instructions}>
          Keep location services and Precise Location enabled for accurate GPS
          captures.
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={isCapturing}
          onPress={() => void captureLocation()}
          style={({ pressed }) => [
            styles.captureButton,
            (pressed || isCapturing) && styles.captureButtonPressed,
          ]}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.captureButtonText}>Capture fresh location</Text>
          )}
        </Pressable>

        <Text style={styles.message}>{message}</Text>

        {capture && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Latest capture</Text>
            <Text style={styles.resultValue}>
              Latitude: {capture.latitude.toFixed(6)}
            </Text>
            <Text style={styles.resultValue}>
              Longitude: {capture.longitude.toFixed(6)}
            </Text>
            <Text style={styles.resultValue}>
              Reported horizontal accuracy: {formatAccuracy(capture.accuracy)}
            </Text>
            <Text style={styles.resultValue}>
              Altitude:{' '}
              {capture.altitude === null
                ? 'Unavailable'
                : `${capture.altitude.toFixed(1)} m`}
            </Text>
            <Text style={styles.resultValue}>
              Time to fix: {(capture.timeToFixMs / 1000).toFixed(1)} seconds
            </Text>
            <Text style={styles.resultValue}>
              Captured: {new Date(capture.capturedAt).toLocaleString()}
            </Text>
          </View>
        )}

        <Text style={styles.logStatus}>
          {savedCount} of {MAX_STORED_CAPTURES} captures saved locally on this
          device.
        </Text>

        <View style={styles.motionSection}>
          <Text style={styles.sectionTitle}>Motion scan probe</Text>
          <Text style={styles.instructions}>
            Takes a motion sample from the device's sensors.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              void (isRecordingMotion
                ? stopMotionRecording()
                : startMotionRecording())
            }
            style={({ pressed }) => [
              styles.motionButton,
              pressed && styles.captureButtonPressed,
            ]}
          >
            <Text style={styles.captureButtonText}>
              {isRecordingMotion
                ? 'Stop and save motion scan'
                : 'Start motion scan'}
            </Text>
          </Pressable>

          <Text style={styles.message}>{motionMessage}</Text>

          {latestMotionSample && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Latest motion sample</Text>
              <Text style={styles.resultValue}>
                Gravity vector: x {latestMotionSample.gravity.x.toFixed(2)}, y{' '}
                {latestMotionSample.gravity.y.toFixed(2)}, z{' '}
                {latestMotionSample.gravity.z.toFixed(2)}
              </Text>
              <Text style={styles.resultValue}>
                Phone rotation: β {latestMotionSample.rotation.beta.toFixed(1)}
                °, γ {latestMotionSample.rotation.gamma.toFixed(1)}°
              </Text>
              <Text style={styles.resultValue}>
                Linear acceleration:{' '}
                {latestMotionSample.linearAccelerationMagnitude?.toFixed(2) ??
                  'Unavailable'}{' '}
                m/s²
              </Text>
              <Text style={styles.resultValue}>
                Rotation rate:{' '}
                {latestMotionSample.rotationRateMagnitude?.toFixed(1) ??
                  'Unavailable'}
                °/s
              </Text>
            </View>
          )}

          {lastMotionSession && (
            <Text style={styles.logStatus}>
              Last scan: {(lastMotionSession.durationMs / 1000).toFixed(1)}{' '}
              seconds, {lastMotionSession.samples.length} samples.
            </Text>
          )}
          <Text style={styles.logStatus}>
            {motionSessionCount} of {MAX_MOTION_SESSIONS} motion scans saved
            locally.
          </Text>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#182230',
  },
  instructions: {
    fontSize: 16,
    lineHeight: 23,
    color: '#475467',
  },
  captureButton: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 10,
  },
  captureButtonPressed: {
    opacity: 0.7,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    color: '#344054',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  resultTitle: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultValue: {
    color: '#344054',
    fontSize: 15,
  },
  logStatus: {
    color: '#667085',
    fontSize: 13,
    marginTop: 'auto',
  },
  motionSection: {
    gap: 14,
    marginTop: 18,
  },
  sectionTitle: {
    color: '#182230',
    fontSize: 22,
    fontWeight: '700',
  },
  motionButton: {
    alignItems: 'center',
    backgroundColor: '#344054',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
  },
});
