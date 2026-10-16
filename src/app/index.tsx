import type { DeviceMotionMeasurement } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
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
const CAMERA_CAPTURE_STORAGE_KEY = 'slope-camera-captures';
const MAX_CAMERA_CAPTURES = 10;
const STABILITY_WINDOW_MS = 800;
const MIN_STABILITY_SAMPLES = 6;
const MAX_AVERAGE_LINEAR_ACCELERATION = 0.7;
const MAX_AVERAGE_ROTATION_RATE = 12;
const MAX_PEAK_LINEAR_ACCELERATION = 1.6;
const MAX_PEAK_ROTATION_RATE = 24;

type GpsCapture = {
  accuracy: number | null;
  altitude: number | null;
  capturedAt: string;
  latitude: number;
  longitude: number;
  timeToFixMs: number;
};

type MotionSnapshot = {
  gravity: { x: number; y: number; z: number };
  linearAccelerationMagnitude: number | null;
  orientation: number;
  rotation: { alpha: number; beta: number; gamma: number };
  rotationRateMagnitude: number | null;
};

type MotionSample = MotionSnapshot & {
  elapsedMs: number;
};

type MotionSession = {
  durationMs: number;
  recordedAt: string;
  samples: MotionSample[];
};

type CameraCapture = {
  capturedAt: string;
  height: number;
  motion: MotionSnapshot;
  uri: string;
  width: number;
};

type StabilityReading = {
  linearAccelerationMagnitude: number;
  recordedAtMs: number;
  rotationRateMagnitude: number;
};

function formatAccuracy(accuracy: number | null) {
  if (accuracy === null) return 'Unavailable';
  return `±${Math.round(accuracy)} m`;
}

function magnitude(x: number, y: number, z: number) {
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
}

function toMotionSnapshot(
  measurement: DeviceMotionMeasurement,
): MotionSnapshot {
  const linearAcceleration = measurement.acceleration;
  const rotationRate = measurement.rotationRate;

  return {
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

function toMotionSample(
  measurement: DeviceMotionMeasurement,
  startedAt: number,
): MotionSample {
  return {
    elapsedMs: Date.now() - startedAt,
    ...toMotionSnapshot(measurement),
  };
}

function isStableWindow(readings: StabilityReading[]) {
  if (readings.length < MIN_STABILITY_SAMPLES) return false;

  const averageLinearAcceleration =
    readings.reduce(
      (total, reading) => total + reading.linearAccelerationMagnitude,
      0,
    ) / readings.length;
  const averageRotationRate =
    readings.reduce(
      (total, reading) => total + reading.rotationRateMagnitude,
      0,
    ) / readings.length;
  const peakLinearAcceleration = Math.max(
    ...readings.map(reading => reading.linearAccelerationMagnitude),
  );
  const peakRotationRate = Math.max(
    ...readings.map(reading => reading.rotationRateMagnitude),
  );

  return (
    averageLinearAcceleration <= MAX_AVERAGE_LINEAR_ACCELERATION &&
    averageRotationRate <= MAX_AVERAGE_ROTATION_RATE &&
    peakLinearAcceleration <= MAX_PEAK_LINEAR_ACCELERATION &&
    peakRotationRate <= MAX_PEAK_ROTATION_RATE
  );
}

export default function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capture, setCapture] = useState<GpsCapture | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraStill, setIsCameraStill] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isRecordingMotion, setIsRecordingMotion] = useState(false);
  const [lastCameraCapture, setLastCameraCapture] =
    useState<CameraCapture | null>(null);
  const [latestMotionSample, setLatestMotionSample] =
    useState<MotionSample | null>(null);
  const [lastMotionSession, setLastMotionSession] =
    useState<MotionSession | null>(null);
  const [message, setMessage] = useState('Ready to request a fresh GPS fix.');
  const [motionMessage, setMotionMessage] = useState(
    'Ready to record a slow handheld scan.',
  );
  const [motionSessionCount, setMotionSessionCount] = useState(0);
  const [cameraCaptureCount, setCameraCaptureCount] = useState(0);
  const [cameraMessage, setCameraMessage] = useState(
    'Enable the camera to begin an offline three-angle scan.',
  );
  const [savedCount, setSavedCount] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const cameraMotionSnapshotRef = useRef<MotionSnapshot | null>(null);
  const cameraMotionSubscriptionRef = useRef<ReturnType<
    typeof DeviceMotion.addListener
  > | null>(null);
  const cameraStabilityReadingsRef = useRef<StabilityReading[]>([]);
  const motionSamplesRef = useRef<MotionSample[]>([]);
  const motionStartedAtRef = useRef<number | null>(null);
  const motionSubscriptionRef = useRef<ReturnType<
    typeof DeviceMotion.addListener
  > | null>(null);

  useEffect(() => {
    void loadSavedCount();
    void loadMotionSessionCount();
    void loadCameraCaptures();

    return () => {
      motionSubscriptionRef.current?.remove();
      cameraMotionSubscriptionRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!cameraPermission?.granted) return;

    let isActive = true;

    async function monitorCameraStability() {
      try {
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('Device motion is unavailable on this device.');
        }

        const permission = await DeviceMotion.requestPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Motion permission was not granted.');
        }

        if (!isActive) return;

        DeviceMotion.setUpdateInterval(MOTION_SAMPLE_INTERVAL_MS);
        setCameraMessage(
          'Hold the phone comfortably for a moment to enable capture. Small hand tremors are allowed.',
        );
        cameraMotionSubscriptionRef.current = DeviceMotion.addListener(
          measurement => {
            const nextSnapshot = toMotionSnapshot(measurement);
            cameraMotionSnapshotRef.current = nextSnapshot;

            const now = Date.now();
            const linearAcceleration = nextSnapshot.linearAccelerationMagnitude;
            const rotationRate = nextSnapshot.rotationRateMagnitude;

            if (linearAcceleration === null || rotationRate === null) {
              cameraStabilityReadingsRef.current = [];
              setIsCameraStill(false);
              return;
            }

            const readings = [
              ...cameraStabilityReadingsRef.current,
              {
                linearAccelerationMagnitude: linearAcceleration,
                recordedAtMs: now,
                rotationRateMagnitude: rotationRate,
              },
            ].filter(
              reading => now - reading.recordedAtMs <= STABILITY_WINDOW_MS,
            );
            cameraStabilityReadingsRef.current = readings;
            setIsCameraStill(isStableWindow(readings));
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown motion-sensor error.';
        setCameraMessage(
          `Camera preview is ready, but stillness checks are unavailable: ${errorMessage}`,
        );
      }
    }

    void monitorCameraStability();

    return () => {
      isActive = false;
      cameraMotionSubscriptionRef.current?.remove();
      cameraMotionSubscriptionRef.current = null;
      cameraMotionSnapshotRef.current = null;
      cameraStabilityReadingsRef.current = [];
      setIsCameraStill(false);
    };
  }, [cameraPermission?.granted]);

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

  async function loadCameraCaptures() {
    const storedCaptures = await AsyncStorage.getItem(
      CAMERA_CAPTURE_STORAGE_KEY,
    );
    if (!storedCaptures) return;

    try {
      const parsedCaptures: unknown = JSON.parse(storedCaptures);
      if (Array.isArray(parsedCaptures)) {
        const captures = parsedCaptures as CameraCapture[];
        setCameraCaptureCount(captures.length);
        setLastCameraCapture(captures[0] ?? null);
      }
    } catch {
      setCameraMessage(
        'Saved camera captures could not be read. New captures will replace them.',
      );
    }
  }

  async function saveCameraCapture(nextCapture: CameraCapture) {
    const storedCaptures = await AsyncStorage.getItem(
      CAMERA_CAPTURE_STORAGE_KEY,
    );
    let previousCaptures: CameraCapture[] = [];

    if (storedCaptures) {
      try {
        const parsedCaptures: unknown = JSON.parse(storedCaptures);
        if (Array.isArray(parsedCaptures))
          previousCaptures = parsedCaptures as CameraCapture[];
      } catch {
        previousCaptures = [];
      }
    }

    const updatedCaptures = [nextCapture, ...previousCaptures].slice(
      0,
      MAX_CAMERA_CAPTURES,
    );
    await AsyncStorage.setItem(
      CAMERA_CAPTURE_STORAGE_KEY,
      JSON.stringify(updatedCaptures),
    );
    setCameraCaptureCount(updatedCaptures.length);
  }

  async function captureCameraPhoto() {
    const motion = cameraMotionSnapshotRef.current;

    if (!cameraRef.current || !isCameraReady) {
      setCameraMessage(
        'Camera preview is still starting. Try again in a moment.',
      );
      return;
    }

    if (!isCameraStill || !motion) {
      setCameraMessage(
        'Let the phone settle briefly before capturing. Small hand tremors are okay.',
      );
      return;
    }

    setIsTakingPhoto(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const capturedAt = new Date();
      const photoDirectory = new Directory(Paths.document, 'slope-captures');
      photoDirectory.create({ idempotent: true, intermediates: true });

      const sourcePhoto = new File(photo.uri);
      const savedPhoto = new File(
        photoDirectory,
        `slope-${capturedAt.getTime()}.jpg`,
      );
      await sourcePhoto.copy(savedPhoto);

      const nextCapture: CameraCapture = {
        capturedAt: capturedAt.toISOString(),
        height: photo.height,
        motion,
        uri: savedPhoto.uri,
        width: photo.width,
      };

      await saveCameraCapture(nextCapture);
      setLastCameraCapture(nextCapture);
      setCameraMessage(
        'Photo and matching motion snapshot saved locally. Shift position for the next overlapping angle.',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown camera error.';
      setCameraMessage(`Unable to capture photo: ${errorMessage}`);
    } finally {
      setIsTakingPhoto(false);
    }
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
      setMotionMessage('Recording motion, hold the phone steady.');
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

        <View style={styles.cameraSection}>
          <Text style={styles.sectionTitle}>Camera scan proof</Text>
          <Text style={styles.instructions}>
            Capture three overlapping views of the ramp: center, then left and
            right. Each photo stays on this device with the phone's gravity and
            motion data at capture time.
          </Text>

          {!cameraPermission ? (
            <ActivityIndicator color="#155EEF" />
          ) : !cameraPermission.granted ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestCameraPermission()}
              style={({ pressed }) => [
                styles.captureButton,
                pressed && styles.captureButtonPressed,
              ]}
            >
              <Text style={styles.captureButtonText}>Enable camera</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.cameraFrame}>
                <CameraView
                  active
                  facing="back"
                  onCameraReady={() => setIsCameraReady(true)}
                  onMountError={event =>
                    setCameraMessage(
                      `Unable to start camera preview: ${event.message}`,
                    )
                  }
                  ref={cameraRef}
                  style={styles.cameraPreview}
                />
              </View>

              <Text
                style={[
                  styles.stabilityStatus,
                  isCameraStill
                    ? styles.stabilityStatusReady
                    : styles.stabilityStatusWaiting,
                ]}
              >
                {isCameraStill
                  ? 'Steady — ready to capture'
                  : 'Settling motion…'}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={!isCameraReady || !isCameraStill || isTakingPhoto}
                onPress={() => void captureCameraPhoto()}
                style={({ pressed }) => [
                  styles.cameraButton,
                  (!isCameraReady ||
                    !isCameraStill ||
                    isTakingPhoto ||
                    pressed) &&
                    styles.captureButtonPressed,
                ]}
              >
                {isTakingPhoto ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.captureButtonText}>
                    Capture steady photo
                  </Text>
                )}
              </Pressable>
            </>
          )}

          <Text style={styles.message}>{cameraMessage}</Text>

          {lastCameraCapture && (
            <View style={styles.resultCard}>
              <Image
                source={{ uri: lastCameraCapture.uri }}
                style={styles.photoPreview}
              />
              <Text style={styles.resultTitle}>Latest camera capture</Text>
              <Text style={styles.resultValue}>
                {lastCameraCapture.width} × {lastCameraCapture.height} pixels
              </Text>
              <Text style={styles.resultValue}>
                Motion at capture: linear acceleration{' '}
                {lastCameraCapture.motion.linearAccelerationMagnitude?.toFixed(
                  2,
                ) ?? 'Unavailable'}{' '}
                m/s²; rotation rate{' '}
                {lastCameraCapture.motion.rotationRateMagnitude?.toFixed(1) ??
                  'Unavailable'}
                °/s
              </Text>
            </View>
          )}

          <Text style={styles.logStatus}>
            {cameraCaptureCount} of {MAX_CAMERA_CAPTURES} camera captures saved
            locally.
          </Text>
        </View>

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
  cameraSection: {
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
  cameraButton: {
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
  },
  cameraFrame: {
    backgroundColor: '#101828',
    borderRadius: 12,
    height: 320,
    overflow: 'hidden',
  },
  cameraPreview: {
    flex: 1,
  },
  photoPreview: {
    alignSelf: 'stretch',
    borderRadius: 8,
    height: 180,
    resizeMode: 'cover',
  },
  stabilityStatus: {
    fontSize: 15,
    fontWeight: '700',
  },
  stabilityStatusReady: {
    color: '#027A48',
  },
  stabilityStatusWaiting: {
    color: '#B54708',
  },
});
