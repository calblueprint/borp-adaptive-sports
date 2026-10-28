import type { KeyValueStore } from '@/utils/trailStorage';
import type { LocationObject } from 'expo-location';
import {
  appendTrailPoint,
  createTrailTrack,
  LevelReading,
  TrailPoint,
  TrailSession,
} from '@/utils/trail';

const METERS_PER_DEGREE_LATITUDE = (6_371_000 * Math.PI) / 180;
const START_MS = Date.parse('2026-10-01T16:00:00.000Z');

export type WalkOptions = {
  /** GPS altitude in metres at a distance, or null for no altitude. */
  altitude?: (distance: number) => number | null;
  /** Barometric height change at a distance, or null for no reading. */
  relativeAltitude?: (distance: number) => number | null;
  lengthMeters: number;
  speedMetersPerSecond?: number;
  startMs?: number;
};

/** A noiseless walk due north, one fix per second, through the recorder. */
export function walk({
  altitude = () => 100,
  lengthMeters,
  relativeAltitude = () => null,
  speedMetersPerSecond = 1,
  startMs = START_MS,
}: WalkOptions): TrailPoint[] {
  let track = createTrailTrack();
  const fixes = Math.floor(lengthMeters / speedMetersPerSecond);
  for (let second = 0; second <= fixes; second += 1) {
    const distance = second * speedMetersPerSecond;
    track = appendTrailPoint(
      track,
      locationAt(distance, startMs + second * 1000, altitude(distance)),
      relativeAltitude(distance),
    );
  }
  return track.points;
}

export function locationAt(
  distance: number,
  timestamp: number,
  altitude: number | null = 100,
): LocationObject {
  return {
    coords: {
      accuracy: 5,
      altitude,
      altitudeAccuracy: altitude === null ? null : 3,
      heading: 0,
      latitude: 37.8 + distance / METERS_PER_DEGREE_LATITUDE,
      longitude: -122.25,
      speed: 1,
    },
    timestamp,
  };
}

/** Elevation of a profile made of straight pieces of given length and grade. */
export function piecewiseGrade(pieces: { grade: number; length: number }[]) {
  return (distance: number) => {
    let elevation = 0;
    let start = 0;
    for (const { grade, length } of pieces) {
      const covered = Math.min(Math.max(distance - start, 0), length);
      elevation += covered * grade;
      start += length;
    }
    return elevation;
  };
}

export function sessionFrom(
  points: TrailPoint[],
  levelReadings: LevelReading[] = [],
): TrailSession {
  return {
    endedAt: points.at(-1)?.capturedAt ?? new Date(START_MS).toISOString(),
    levelReadings,
    points,
    recordedAt: points[0]?.capturedAt ?? new Date(START_MS).toISOString(),
    totalDistanceMeters: points.at(-1)?.cumulativeDistanceMeters ?? 0,
  };
}

export class MemoryStore implements KeyValueStore {
  items = new Map<string, string>();

  async getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  async removeItem(key: string) {
    this.items.delete(key);
  }

  async setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}
