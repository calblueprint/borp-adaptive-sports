import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Barometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  appendTrailPoint,
  createTrailTrack,
  formatDistance,
  formatGrade,
  LevelReading,
  MAX_TRAIL_POINTS,
  TrailPoint,
  TrailSession,
  TrailTrack,
} from '@/utils/trail';
import {
  loadTrailSession,
  loadTrailSessionIndex,
  saveTrailSession,
} from '@/utils/trailStorage';

export type TrailRecorderStatus =
  | 'idle'
  | 'starting'
  | 'recording'
  | 'stopping';

type BarometerSubscription = ReturnType<typeof Barometer.addListener>;

/**
 * Fixes are recorded as they arrive, but the screen (and the profile and
 * accessibility analysis it drives) refreshes at most this often.
 */
export const LIVE_UPDATE_INTERVAL_MS = 1000;

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function liveMessage(points: TrailPoint[]) {
  const latest = points.at(-1);
  return latest?.gradePercent == null
    ? 'Recording raw fixes. Grade will appear only after enough accurate elevation data is available.'
    : `Recording. Rolling grade over ${formatDistance(latest.gradeWindowDistanceMeters ?? 0)}: ${formatGrade(latest.gradePercent)}.`;
}

export function useTrailRecorder() {
  const [status, setStatus] = useState<TrailRecorderStatus>('idle');
  const [message, setMessage] = useState(
    'Ready to record an offline trail profile.',
  );
  const [livePoints, setLivePoints] = useState<TrailPoint[]>([]);
  const [liveLevelReadings, setLiveLevelReadings] = useState<LevelReading[]>(
    [],
  );
  const [lastSession, setLastSession] = useState<TrailSession | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [usesBarometer, setUsesBarometer] = useState(false);

  const statusRef = useRef<TrailRecorderStatus>('idle');
  const isMountedRef = useRef(true);
  const trackRef = useRef<TrailTrack>(createTrailTrack());
  const levelReadingsRef = useRef<LevelReading[]>([]);
  const startedAtRef = useRef<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const barometerRef = useRef<BarometerSubscription | null>(null);
  // Latest barometric height change since recording started (iPhone only).
  const relativeAltitudeRef = useRef<number | null>(null);
  const liveUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set once this screen records a session, so a slow initial load of saved
  // profiles cannot replace it on screen.
  const hasRecordedRef = useRef(false);

  // Read through a function so TypeScript does not keep a narrowed value
  // across the awaits in start().
  function readStatus() {
    return statusRef.current;
  }

  function updateStatus(next: TrailRecorderStatus) {
    statusRef.current = next;
    if (isMountedRef.current) setStatus(next);
  }

  function stopBarometer() {
    barometerRef.current?.remove();
    barometerRef.current = null;
    relativeAltitudeRef.current = null;
  }

  async function startBarometer() {
    stopBarometer();
    try {
      if (!(await Barometer.isAvailableAsync())) return false;
    } catch {
      return false;
    }
    // CMAltimeter reports height relative to when updates began.
    barometerRef.current = Barometer.addListener(({ relativeAltitude }) => {
      relativeAltitudeRef.current = relativeAltitude ?? null;
    });
    return true;
  }

  function cancelLiveUpdate() {
    if (liveUpdateRef.current !== null) clearTimeout(liveUpdateRef.current);
    liveUpdateRef.current = null;
  }

  /** Copies the recorded fixes to the screen; the copy is made once a second. */
  function publishLivePoints() {
    cancelLiveUpdate();
    if (!isMountedRef.current) return;
    const points = trackRef.current.points.slice();
    setLivePoints(points);
    if (statusRef.current === 'recording') setMessage(liveMessage(points));
  }

  useEffect(() => {
    isMountedRef.current = true;
    void (async () => {
      try {
        const index = await loadTrailSessionIndex(AsyncStorage);
        if (!isMountedRef.current) return;
        setSessionCount(index.length);
        const newest = index[0];
        if (!newest || hasRecordedRef.current) return;
        const session = await loadTrailSession(AsyncStorage, newest.id);
        if (isMountedRef.current && !hasRecordedRef.current)
          setLastSession(session);
      } catch {
        if (isMountedRef.current)
          setMessage(
            'Saved trail profiles could not be read. New recordings will still be saved.',
          );
      }
    })();

    return () => {
      isMountedRef.current = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      barometerRef.current?.remove();
      barometerRef.current = null;
      if (liveUpdateRef.current !== null) clearTimeout(liveUpdateRef.current);
      statusRef.current = 'idle';
    };
  }, []);

  async function stop(reason?: string) {
    // Only the first caller (button, watch error or point cap) saves. A stop
    // while still starting makes start() discard its new subscription.
    if (statusRef.current === 'idle' || statusRef.current === 'stopping')
      return;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    stopBarometer();
    publishLivePoints();

    const startedAt = startedAtRef.current;
    const { points } = trackRef.current;
    const levelReadings = levelReadingsRef.current;
    startedAtRef.current = null;
    const prefix = reason ? `${reason} ` : '';

    if (!startedAt || points.length === 0) {
      updateStatus('idle');
      setMessage(`${prefix}No trail points were recorded. Try again outdoors.`);
      return;
    }

    // Keep showing the new trail while it saves, rather than the previous one.
    updateStatus('stopping');
    hasRecordedRef.current = true;
    const session: TrailSession = {
      endedAt: new Date().toISOString(),
      levelReadings,
      points,
      recordedAt: startedAt,
      totalDistanceMeters: points.at(-1)?.cumulativeDistanceMeters ?? 0,
    };

    let outcome: string;
    try {
      const index = await saveTrailSession(AsyncStorage, session);
      if (isMountedRef.current) setSessionCount(index.length);
      outcome = `${prefix}Trail profile saved locally with ${points.length} raw fixes over ${formatDistance(session.totalDistanceMeters)}.`;
    } catch (error) {
      outcome = `${prefix}Trail recording stopped, but it could not be saved: ${errorText(error, 'Unknown storage error.')}`;
    }
    if (!isMountedRef.current) return;
    setLastSession(session);
    setMessage(outcome);
    updateStatus('idle');
  }

  function recordFix(location: Location.LocationObject) {
    // Ignore fixes delivered after stop() or before start() finished.
    if (statusRef.current !== 'recording' && statusRef.current !== 'starting')
      return;

    const track = appendTrailPoint(
      trackRef.current,
      location,
      relativeAltitudeRef.current,
    );
    trackRef.current = track;

    if (track.points.length >= MAX_TRAIL_POINTS) {
      void stop(
        `Reached the ${MAX_TRAIL_POINTS.toLocaleString()}-fix limit, so recording stopped automatically.`,
      );
      return;
    }

    if (liveUpdateRef.current === null)
      liveUpdateRef.current = setTimeout(
        publishLivePoints,
        LIVE_UPDATE_INTERVAL_MS,
      );
  }

  async function start() {
    if (statusRef.current !== 'idle') return;
    updateStatus('starting');
    setMessage('Checking Location Services…');

    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        throw new Error(
          'Location Services are off. Enable them before recording a trail.',
        );
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error(
          'Location permission was not granted. Allow Precise Location while using the app.',
        );
      }

      cancelLiveUpdate();
      trackRef.current = createTrailTrack();
      levelReadingsRef.current = [];
      startedAtRef.current = new Date().toISOString();
      setLivePoints([]);
      setLiveLevelReadings([]);

      const hasBarometer = await startBarometer();
      if (isMountedRef.current) setUsesBarometer(hasBarometer);

      const subscription = await Location.watchPositionAsync(
        {
          // iOS delivers about one fix per second at a 1 m interval, the most
          // it offers. Coarser intervals did not improve the profile in
          // simulation; GPS jitter is removed afterwards by smoothing (see
          // utils/elevationProfile.ts). timeInterval only applies on Android.
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        recordFix,
        reason => void stop(`Location updates failed (${reason}).`),
      );

      // stop() or unmount may have run while permissions were pending.
      const stillStarting = readStatus() === 'starting';
      if (!isMountedRef.current || !stillStarting) {
        subscription.remove();
        stopBarometer();
        return;
      }
      subscriptionRef.current = subscription;
      updateStatus('recording');
      setMessage(
        permission.ios?.accuracy === 'reduced'
          ? 'Recording with reduced location precision. Distances will be rough and grades may stay unavailable.'
          : hasBarometer
            ? 'Recording with barometer elevation. Move along the trail with the screen open.'
            : 'Recording with GPS elevation only (no barometer found). Move along the trail with the screen open.',
      );
    } catch (error) {
      startedAtRef.current = null;
      stopBarometer();
      updateStatus('idle');
      if (isMountedRef.current) {
        setMessage(
          `Unable to start trail recording: ${errorText(error, 'Unknown location error.')}`,
        );
      }
    }
  }

  /** Attaches a level reading to the current spot on the trail. */
  function addLevelReading(
    reading: Omit<LevelReading, 'capturedAt' | 'distanceMeters'>,
  ) {
    if (statusRef.current !== 'recording') return;
    const next: LevelReading = {
      ...reading,
      capturedAt: new Date().toISOString(),
      distanceMeters:
        trackRef.current.lastTravelPoint?.cumulativeDistanceMeters ?? 0,
    };
    levelReadingsRef.current = [...levelReadingsRef.current, next];
    setLiveLevelReadings(levelReadingsRef.current);
    setMessage(
      `Level reading saved at ${formatDistance(next.distanceMeters)}: ${next.runningSlopePercent.toFixed(1)}% running, ${next.crossSlopePercent.toFixed(1)}% cross slope.`,
    );
  }

  const isRecording = status === 'recording';
  // While starting, recording or saving, show the trail being recorded.
  const showsLiveTrail = status !== 'idle';

  return {
    addLevelReading,
    displayedLevelReadings: showsLiveTrail
      ? liveLevelReadings
      : (lastSession?.levelReadings ?? []),
    displayedPoints: showsLiveTrail ? livePoints : (lastSession?.points ?? []),
    isRecording,
    message,
    sessionCount,
    start,
    status,
    stop: () => stop(),
    usesBarometer,
  };
}
