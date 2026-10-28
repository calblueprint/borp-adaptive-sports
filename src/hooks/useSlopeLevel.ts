import type { GravitySample } from '@/utils/slopeLevel';
import { useEffect, useRef, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { assessLevel } from '@/utils/slopeLevel';

type MotionSubscription = ReturnType<typeof DeviceMotion.addListener>;

export type SlopeLevelReading = {
  /** Tilt across the phone's width, as a percent grade. */
  crossSlopePercent: number;
  /** Tilt along the phone's length, as a percent grade. */
  runningSlopePercent: number;
  /** True once recent samples agree, so the phone is resting still. */
  steady: boolean;
};

const UPDATE_INTERVAL_MS = 100;
/** About one and a half seconds of samples is averaged into each reading. */
const SAMPLE_COUNT = 15;

/**
 * Turns the phone into a digital level. Lay it flat on the trail with its
 * top pointing along the direction of travel: tilt along its length is the
 * running slope and tilt across its width is the cross slope.
 */
export function useSlopeLevel() {
  const [reading, setReading] = useState<SlopeLevelReading | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const subscriptionRef = useRef<MotionSubscription | null>(null);
  const samplesRef = useRef<GravitySample[]>([]);
  const sampleCountRef = useRef(0);
  const steadyRef = useRef(false);

  useEffect(
    () => () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    },
    [],
  );

  function handleSample(sample: GravitySample) {
    const samples = [...samplesRef.current, sample].slice(-SAMPLE_COUNT);
    samplesRef.current = samples;
    sampleCountRef.current += 1;
    // Update the screen every few samples rather than ten times a second.
    if (samples.length < SAMPLE_COUNT || sampleCountRef.current % 3 !== 0)
      return;

    const assessment = assessLevel(samples, steadyRef.current);
    if (!assessment.flat) {
      steadyRef.current = false;
      setReading(null);
      setMessage('Lay the phone flat on the trail surface, screen up.');
      return;
    }

    const { crossSlopePercent, runningSlopePercent, steady } = assessment;
    steadyRef.current = steady;
    setReading({ crossSlopePercent, runningSlopePercent, steady });
    setMessage(steady ? null : 'Hold still for a steady reading.');
  }

  async function start() {
    if (subscriptionRef.current) return;
    try {
      if (!(await DeviceMotion.isAvailableAsync())) {
        setMessage('This device has no motion sensor for the level.');
        return;
      }
      const permission = await DeviceMotion.requestPermissionsAsync();
      if (!permission.granted) {
        setMessage('Motion access was not granted, so the level cannot run.');
        return;
      }
    } catch {
      setMessage('The motion sensor could not be started.');
      return;
    }

    samplesRef.current = [];
    steadyRef.current = false;
    DeviceMotion.setUpdateInterval(UPDATE_INTERVAL_MS);
    subscriptionRef.current = DeviceMotion.addListener(measurement => {
      const gravity = measurement.accelerationIncludingGravity;
      if (gravity) handleSample(gravity);
    });
    setIsActive(true);
    setMessage('Lay the phone flat on the trail surface, screen up.');
  }

  function stop() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    samplesRef.current = [];
    steadyRef.current = false;
    setIsActive(false);
    setReading(null);
    setMessage(null);
  }

  return { isActive, message, reading, start, stop };
}
