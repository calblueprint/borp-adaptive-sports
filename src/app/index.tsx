import { useEffect, useState } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAPTURE_STORAGE_KEY = 'offline-gps-captures';
const MAX_STORED_CAPTURES = 20;

type GpsCapture = {
  accuracy: number | null;
  altitude: number | null;
  capturedAt: string;
  latitude: number;
  longitude: number;
  timeToFixMs: number;
};

function formatAccuracy(accuracy: number | null) {
  if (accuracy === null) return 'Unavailable';
  return `±${Math.round(accuracy)} m`;
}

export default function App() {
  const [capture, setCapture] = useState<GpsCapture | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState('Ready to request a fresh GPS fix.');
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    void loadSavedCount();
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
});
