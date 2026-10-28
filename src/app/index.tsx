import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccessibilityReportCard from '@/components/AccessibilityReportCard';
import ElevationProfileChart from '@/components/ElevationProfileChart';
import SlopeLevelCard from '@/components/SlopeLevelCard';
import { useSlopeLevel } from '@/hooks/useSlopeLevel';
import { useTrailRecorder } from '@/hooks/useTrailRecorder';
import {
  AccessibilityStandard,
  analyzeTrailAccessibility,
  TrailSurface,
  trailToCsv,
} from '@/utils/accessibility';
import { buildElevationProfile } from '@/utils/elevationProfile';
import {
  BAROMETER_GRADE_WINDOW_METERS,
  formatAccuracy,
  formatDistance,
  formatElevation,
  formatGrade,
  GRADE_WINDOW_METERS,
  MAX_TRAIL_POINTS,
  MAX_TRAIL_SESSIONS,
  MAX_USABLE_ALTITUDE_ACCURACY_METERS,
} from '@/utils/trail';

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

export default function App() {
  const [capture, setCapture] = useState<GpsCapture | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState('Ready to request a fresh GPS fix.');
  const [savedCount, setSavedCount] = useState(0);
  const [standard, setStandard] = useState<AccessibilityStandard>('trail');
  const [surface, setSurface] = useState<TrailSurface>('natural');
  const trail = useTrailRecorder();
  const level = useSlopeLevel();

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

  const latestTrailPoint = trail.displayedPoints.at(-1) ?? null;
  const profile = useMemo(
    () => buildElevationProfile(trail.displayedPoints),
    [trail.displayedPoints],
  );
  const report = useMemo(
    () =>
      analyzeTrailAccessibility(
        trail.displayedPoints,
        trail.displayedLevelReadings,
        standard,
        surface,
      ),
    [trail.displayedPoints, trail.displayedLevelReadings, standard, surface],
  );
  const violations = report.findings.filter(f => f.severity === 'violation');

  async function shareProfileCsv() {
    try {
      await Share.share({
        message: trailToCsv(
          trail.displayedPoints,
          trail.displayedLevelReadings,
        ),
        title: 'Trail elevation profile (CSV)',
      });
    } catch {
      // The share sheet was dismissed or is unavailable; nothing to undo.
    }
  }
  // Busy while permissions are requested and while the profile saves.
  const isTrailBusy =
    trail.status === 'starting' || trail.status === 'stopping';
  const trailButtonLabel =
    trail.status === 'stopping'
      ? 'Saving trail profile'
      : trail.isRecording
        ? 'Stop and save trail profile'
        : 'Start trail profile';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          Offline GPS proof
        </Text>
        <Text style={styles.instructions}>
          Keep location services and Precise Location enabled for accurate GPS
          captures.
        </Text>

        <Pressable
          accessibilityLabel="Capture fresh location"
          accessibilityRole="button"
          accessibilityState={{ busy: isCapturing, disabled: isCapturing }}
          disabled={isCapturing}
          onPress={() => void captureLocation()}
          style={({ pressed }) => [
            styles.captureButton,
            (pressed || isCapturing) && styles.buttonPressed,
          ]}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Capture fresh location</Text>
          )}
        </Pressable>

        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>

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
              Altitude: {formatElevation(capture.altitude)}
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

        <View style={styles.trailSection}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Offline trail profile
          </Text>
          <Text style={styles.instructions}>
            Record a foreground trail trace locally. The graph uses cumulative
            travelled distance, so a backtrack remains visible as another pass.
            An offline route file would be needed to identify sidetracks or
            route progress.
          </Text>

          <Pressable
            accessibilityLabel={trailButtonLabel}
            accessibilityRole="button"
            accessibilityState={{
              busy: isTrailBusy,
              disabled: isTrailBusy,
            }}
            disabled={isTrailBusy}
            onPress={() =>
              void (trail.isRecording ? trail.stop() : trail.start())
            }
            style={({ pressed }) => [
              styles.trailButton,
              (pressed || isTrailBusy) && styles.buttonPressed,
            ]}
          >
            {isTrailBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{trailButtonLabel}</Text>
            )}
          </Pressable>

          <Text accessibilityLiveRegion="polite" style={styles.message}>
            {trail.message}
          </Text>

          {latestTrailPoint && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                {trail.status === 'idle'
                  ? 'Latest saved trail'
                  : 'Latest trail fix'}
              </Text>
              <Text style={styles.resultValue}>
                Travel distance:{' '}
                {formatDistance(latestTrailPoint.cumulativeDistanceMeters)}
              </Text>
              <Text style={styles.resultValue}>
                Device-reported elevation:{' '}
                {formatElevation(latestTrailPoint.altitude)}
                {' · '}vertical accuracy:{' '}
                {formatAccuracy(latestTrailPoint.altitudeAccuracy)}
              </Text>
              <Text style={styles.resultValue}>
                Horizontal accuracy:{' '}
                {formatAccuracy(latestTrailPoint.horizontalAccuracy)}
              </Text>
              <Text style={styles.resultValue}>
                Rolling grade: {formatGrade(latestTrailPoint.gradePercent)}
                {latestTrailPoint.gradeWindowDistanceMeters !== null
                  ? ` over ${formatDistance(latestTrailPoint.gradeWindowDistanceMeters)}`
                  : ''}
              </Text>
            </View>
          )}

          {profile && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Elevation</Text>
              <ElevationProfileChart
                flaggedRanges={violations.filter(f => !f.wholeTrail)}
                profile={profile}
              />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Elevation Gain</Text>
                <Text style={styles.statValue}>
                  {Math.round(profile.gainMeters)} m
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>
                  {profile.absolute
                    ? 'Max Elevation'
                    : 'Max Height Above Start'}
                </Text>
                <Text style={styles.statValue}>
                  {Math.round(profile.maxElevation)} m
                </Text>
              </View>
              <Text style={styles.profileNote}>
                {profile.source === 'barometer'
                  ? profile.absolute
                    ? 'Barometer heights, placed at sea-level elevation using GPS.'
                    : 'Barometer heights relative to the start (GPS altitude was too weak to place them).'
                  : 'GPS altitude only, so small bumps are smoothed away.'}{' '}
                Drag across the chart to read a point. Red marks possible
                violations.
              </Text>
            </View>
          )}

          {trail.displayedPoints.length > 0 && (
            <AccessibilityReportCard
              onExport={() => void shareProfileCsv()}
              onStandardChange={setStandard}
              onSurfaceChange={setSurface}
              report={report}
              standard={standard}
              surface={surface}
            />
          )}

          <SlopeLevelCard
            canSave={trail.isRecording}
            isActive={level.isActive}
            message={level.message}
            onSave={reading =>
              trail.addLevelReading({
                crossSlopePercent: reading.crossSlopePercent,
                runningSlopePercent: reading.runningSlopePercent,
              })
            }
            onToggle={() =>
              void (level.isActive ? level.stop() : level.start())
            }
            reading={level.reading}
            savedReadings={trail.displayedLevelReadings}
          />

          <Text style={styles.trailWarning}>
            This is a screening signal, not a wheelchair-accessibility rating.
            With the iPhone barometer, grade is estimated over at least{' '}
            {BAROMETER_GRADE_WINDOW_METERS} m of travel; with GPS elevation
            only, over at least {GRADE_WINDOW_METERS} m, and fixes with vertical
            accuracy worse than ±{MAX_USABLE_ALTITUDE_ACCURACY_METERS} m are
            left out. Use the level for cross slope and pitches shorter than
            that.
          </Text>
          <Text style={styles.logStatus}>
            {trail.sessionCount} of {MAX_TRAIL_SESSIONS} trail profiles saved
            locally. Recording stops and saves automatically at{' '}
            {MAX_TRAIL_POINTS.toLocaleString()} raw fixes.
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
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
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
  trailSection: {
    gap: 14,
    marginTop: 18,
  },
  sectionTitle: {
    color: '#182230',
    fontSize: 22,
    fontWeight: '700',
  },
  trailButton: {
    alignItems: 'center',
    backgroundColor: '#344054',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
  },
  trailWarning: {
    color: '#B54708',
    fontSize: 13,
    lineHeight: 19,
  },
  statRow: {
    borderTopColor: '#EAECF0',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statLabel: {
    color: '#475467',
    fontSize: 15,
  },
  statValue: {
    color: '#101828',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  profileNote: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
  },
});
