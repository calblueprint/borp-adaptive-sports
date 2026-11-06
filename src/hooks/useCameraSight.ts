import type {
  LockedSight,
  MarkerHeight,
  SightAssessment,
  TwoWayResult,
  Vector3,
} from '@/utils/sightSlope';
import { useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  assessSight,
  gravityFromMotion,
  MAX_PLAUSIBLE_OFFSET_DEGREES,
  twoWayGrade,
} from '@/utils/sightSlope';

type MotionSubscription = ReturnType<typeof DeviceMotion.addListener>;

export type SightStation = 'fore' | 'back';

export type SavedSight = TwoWayResult & {
  back: LockedSight;
  capturedAt: string;
  fore: LockedSight;
  latitude: number | null;
  longitude: number | null;
  markerHeight: MarkerHeight;
};

const UPDATE_INTERVAL_MS = 50;
/** One second of samples is averaged into each sight. */
const SAMPLE_COUNT = 20;
/** Samples right after the tap are dropped, since the tap jolts the phone. */
const SETTLE_MS = 600;
/** Give up on a lock that cannot get steady in this long. */
const LOCK_TIMEOUT_MS = 12_000;
/** A last-known GPS fix older than this is not attached to a reading. */
const MAX_LOCATION_AGE_MS = 120_000;
const CALIBRATION_STORAGE_KEY = 'camera-sight-calibration';
const SIGHTS_STORAGE_KEY = 'camera-sight-readings';
const MAX_SAVED_SIGHTS = 50;

type PendingLock = { station: SightStation; startedAt: number };

async function lastKnownCoordinates() {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const position = await Location.getLastKnownPositionAsync({
      maxAge: MAX_LOCATION_AGE_MS,
    });
    return position?.coords ?? null;
  } catch {
    return null;
  }
}

/**
 * Camera clinometer. While active it reads the camera axis angle from the
 * motion sensor, and locks a fore or back sight once the phone is steady.
 */
export function useCameraSight() {
  const [isActive, setIsActive] = useState(false);
  const [live, setLive] = useState<SightAssessment | null>(null);
  const [fore, setFore] = useState<LockedSight | null>(null);
  const [back, setBack] = useState<LockedSight | null>(null);
  const [locking, setLocking] = useState<SightStation | null>(null);
  const [markerHeight, setMarkerHeight] = useState<MarkerHeight>('phone');
  const [offsetDegrees, setOffsetDegrees] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const subscriptionRef = useRef<MotionSubscription | null>(null);
  const samplesRef = useRef<Vector3[]>([]);
  const sampleCountRef = useRef(0);
  const steadyRef = useRef(false);
  const pendingRef = useRef<PendingLock | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    void (async () => {
      try {
        const [storedOffset, storedSights] = await Promise.all([
          AsyncStorage.getItem(CALIBRATION_STORAGE_KEY),
          AsyncStorage.getItem(SIGHTS_STORAGE_KEY),
        ]);
        const offset = storedOffset === null ? NaN : Number(storedOffset);
        if (isMountedRef.current && Number.isFinite(offset))
          setOffsetDegrees(offset);
        const sights: unknown = storedSights ? JSON.parse(storedSights) : [];
        if (isMountedRef.current && Array.isArray(sights))
          setSavedCount(sights.length);
      } catch {
        // Unreadable saved data is replaced on the next save.
      }
    })();
    return () => {
      isMountedRef.current = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  function finishLock(station: SightStation, sight: LockedSight) {
    pendingRef.current = null;
    setLocking(null);
    Vibration.vibrate();
    if (station === 'fore') {
      setFore(sight);
      setBack(null);
      setMessage(
        'Fore sight locked. Walk to the marker, stand where it was, and sight back at the marker you left behind.',
      );
    } else {
      setBack(sight);
      setMessage(null);
    }
  }

  function handleSample(gravity: Vector3) {
    const pending = pendingRef.current;
    if (pending && Date.now() - pending.startedAt < SETTLE_MS) {
      // Drop the jolt from tapping the button.
      samplesRef.current = [];
      return;
    }

    const samples = [...samplesRef.current, gravity].slice(-SAMPLE_COUNT);
    samplesRef.current = samples;
    sampleCountRef.current += 1;
    if (samples.length < SAMPLE_COUNT) return;

    const assessment = assessSight(samples, steadyRef.current);
    if (!assessment) return;
    steadyRef.current = assessment.steady;

    if (pending) {
      if (assessment.steady) {
        finishLock(pending.station, {
          elevationDegrees: assessment.elevationDegrees,
          sampleCount: samples.length,
          spreadDegrees: assessment.spreadDegrees,
        });
      } else if (Date.now() - pending.startedAt > LOCK_TIMEOUT_MS) {
        pendingRef.current = null;
        setLocking(null);
        setMessage(
          'Could not get a steady sight. Tuck your elbows in, hold the phone with both hands, and try again.',
        );
      }
    }

    // Update the screen every few samples rather than twenty times a second.
    if (sampleCountRef.current % 4 === 0) setLive(assessment);
  }

  async function start() {
    if (subscriptionRef.current) return;
    try {
      if (!(await DeviceMotion.isAvailableAsync())) {
        setMessage('This device has no motion sensor, so it cannot sight.');
        return;
      }
      const permission = await DeviceMotion.requestPermissionsAsync();
      if (!permission.granted) {
        setMessage('Motion access was not granted, so sighting cannot run.');
        return;
      }
    } catch {
      setMessage('The motion sensor could not be started.');
      return;
    }
    if (!isMountedRef.current) return;

    samplesRef.current = [];
    steadyRef.current = false;
    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
    subscriptionRef.current = DeviceMotion.addListener(measurement => {
      const gravity = gravityFromMotion({
        acceleration: measurement.acceleration ?? null,
        accelerationIncludingGravity:
          measurement.accelerationIncludingGravity ?? null,
      });
      if (gravity) handleSample(gravity);
    });
    setIsActive(true);
    setMessage(null);
  }

  function stop() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    samplesRef.current = [];
    steadyRef.current = false;
    pendingRef.current = null;
    setIsActive(false);
    setLive(null);
    setLocking(null);
    setMessage(null);
  }

  function lock(station: SightStation) {
    if (!subscriptionRef.current) return;
    samplesRef.current = [];
    steadyRef.current = false;
    pendingRef.current = { station, startedAt: Date.now() };
    setLocking(station);
    setMessage('Hold the crosshair on the marker. It locks when steady.');
  }

  function reset() {
    pendingRef.current = null;
    setLocking(null);
    setFore(null);
    setBack(null);
    setMessage(null);
  }

  const result = fore && back ? twoWayGrade(fore, back, markerHeight) : null;

  /**
   * Keeps the two-way result in the on-device log, and with markers at phone
   * height, uses its angle offset to correct later one-way readings.
   */
  async function saveResult() {
    if (!fore || !back || !result) return null;
    const coords = await lastKnownCoordinates();
    const saved: SavedSight = {
      ...result,
      back,
      capturedAt: new Date().toISOString(),
      fore,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      markerHeight,
    };

    const calibrates =
      result.offsetDegrees !== null &&
      Math.abs(result.offsetDegrees) <= MAX_PLAUSIBLE_OFFSET_DEGREES;
    try {
      const stored = await AsyncStorage.getItem(SIGHTS_STORAGE_KEY);
      let previous: SavedSight[] = [];
      try {
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed)) previous = parsed as SavedSight[];
      } catch {
        previous = [];
      }
      const updated = [saved, ...previous].slice(0, MAX_SAVED_SIGHTS);
      await AsyncStorage.setItem(SIGHTS_STORAGE_KEY, JSON.stringify(updated));
      if (calibrates && result.offsetDegrees !== null) {
        await AsyncStorage.setItem(
          CALIBRATION_STORAGE_KEY,
          String(result.offsetDegrees),
        );
      }
      if (!isMountedRef.current) return saved;
      setSavedCount(updated.length);
      if (calibrates) setOffsetDegrees(result.offsetDegrees);
      setMessage(
        calibrates
          ? 'Sight saved on this device. Its angle offset now corrects the live one-way reading.'
          : 'Sight saved on this device.',
      );
    } catch {
      if (isMountedRef.current)
        setMessage('The sight could not be saved on this device.');
    }
    return saved;
  }

  return {
    back,
    fore,
    isActive,
    live,
    lock,
    locking,
    markerHeight,
    message,
    offsetDegrees,
    reset,
    result,
    saveResult,
    savedCount,
    setMarkerHeight,
    start,
    stop,
  };
}
