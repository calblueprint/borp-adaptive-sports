import type { LocationObject } from 'expo-location';

/** Key of the original all-sessions-in-one storage format, kept to migrate. */
export const LEGACY_TRAIL_PROFILE_STORAGE_KEY = 'offline-trail-profiles';
export const MAX_TRAIL_SESSIONS = 10;
export const MAX_TRAIL_POINTS = 10_000;

/** Fixes with worse horizontal accuracy are kept but never move the distance. */
export const MAX_USABLE_HORIZONTAL_ACCURACY_METERS = 20;
/** Fixes with worse vertical accuracy are kept but excluded from grade and chart. */
export const MAX_USABLE_ALTITUDE_ACCURACY_METERS = 10;
/** Floor for the movement needed before distance accumulates. */
export const MIN_TRAVEL_STEP_METERS = 2;

/**
 * Grade is a least-squares slope over at least this much travelled distance.
 * GPS altitude noise is several metres, so short windows produce meaningless
 * grades (a 5% slope rises only 0.75 m over 15 m).
 */
export const GRADE_WINDOW_METERS = 50;
/** If accurate fixes are this sparse, the window is too stale to report. */
export const MAX_GRADE_WINDOW_METERS = 100;
export const MIN_GRADE_POINTS = 5;

/**
 * The iPhone barometer tracks height changes to roughly 10 cm, so grade can
 * use a much shorter window than GPS altitude allows.
 */
export const BAROMETER_GRADE_WINDOW_METERS = 10;
export const MAX_BAROMETER_GRADE_WINDOW_METERS = 25;
export const MIN_BAROMETER_GRADE_POINTS = 3;
/**
 * A session uses barometric elevation only when this share of its usable
 * fixes carry a barometer reading; otherwise the whole session uses GPS, so
 * the source never switches part-way and no stretch is silently dropped.
 */
export const MIN_BAROMETER_COVERAGE = 0.95;

const GRADE_WINDOWS = {
  barometer: {
    maxWindowMeters: MAX_BAROMETER_GRADE_WINDOW_METERS,
    minPoints: MIN_BAROMETER_GRADE_POINTS,
    windowMeters: BAROMETER_GRADE_WINDOW_METERS,
  },
  gps: {
    maxWindowMeters: MAX_GRADE_WINDOW_METERS,
    minPoints: MIN_GRADE_POINTS,
    windowMeters: GRADE_WINDOW_METERS,
  },
};

export type TrailPoint = {
  altitude: number | null;
  altitudeAccuracy: number | null;
  capturedAt: string;
  cumulativeDistanceMeters: number;
  gradePercent: number | null;
  gradeWindowDistanceMeters: number | null;
  heading: number | null;
  horizontalAccuracy: number | null;
  latitude: number;
  longitude: number;
  /** Barometric height change since recording started, when available. */
  relativeAltitude: number | null;
  speed: number | null;
};

/** A phone-tilt reading taken with the phone laid flat on the trail. */
export type LevelReading = {
  capturedAt: string;
  crossSlopePercent: number;
  distanceMeters: number;
  runningSlopePercent: number;
};

export type TrailSession = {
  endedAt: string;
  levelReadings: LevelReading[];
  points: TrailPoint[];
  recordedAt: string;
  totalDistanceMeters: number;
};

/** Where a point's elevation comes from: barometer when the phone has one. */
export type ElevationSource = 'barometer' | 'gps';

export type GradeEstimate = {
  percent: number;
  source: ElevationSource;
  windowDistanceMeters: number;
};

export type TrailTrack = {
  /** Last fix that advanced (or anchored) the travelled distance. */
  lastTravelPoint: TrailPoint | null;
  points: TrailPoint[];
};

/** A fresh track. appendTrailPoint adds to its points array in place. */
export function createTrailTrack(): TrailTrack {
  return { lastTravelPoint: null, points: [] };
}

export function formatAccuracy(accuracy: number | null) {
  if (accuracy === null) return 'Unavailable';
  return `±${Math.round(accuracy)} m`;
}

export function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1_000)
    return `${(distanceMeters / 1_000).toFixed(2)} km`;
  return `${Math.round(distanceMeters)} m`;
}

export function formatElevation(elevation: number | null) {
  if (elevation === null) return 'Unavailable';
  return `${elevation.toFixed(1)} m`;
}

export function formatGrade(grade: number | null) {
  if (grade === null) return 'Collecting reliable elevation data';
  return `${grade >= 0 ? '+' : ''}${grade.toFixed(1)}%`;
}

type Coordinates = { latitude: number; longitude: number };

export function distanceBetweenPoints(first: Coordinates, second: Coordinates) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

/** iOS reports a negative accuracy when a reading is invalid; 0 is valid. */
function isValidAccuracyAtMost(value: number | null, limit: number) {
  return (
    value !== null && Number.isFinite(value) && value >= 0 && value <= limit
  );
}

export function isUsableForDistance(point: TrailPoint) {
  return isValidAccuracyAtMost(
    point.horizontalAccuracy,
    MAX_USABLE_HORIZONTAL_ACCURACY_METERS,
  );
}

export function hasUsableAltitude(point: TrailPoint) {
  return (
    point.altitude !== null &&
    Number.isFinite(point.altitude) &&
    isValidAccuracyAtMost(
      point.altitudeAccuracy,
      MAX_USABLE_ALTITUDE_ACCURACY_METERS,
    )
  );
}

export function isUsableForGrade(point: TrailPoint) {
  return hasUsableAltitude(point) && isUsableForDistance(point);
}

/** The point's elevation from the given source, or null if not usable. */
export function elevationFrom(point: TrailPoint, source: ElevationSource) {
  if (!isUsableForDistance(point)) return null;
  if (source === 'barometer') return point.relativeAltitude;
  return hasUsableAltitude(point) ? point.altitude : null;
}

/** Share of the fixes usable for distance that carry a barometer reading. */
export function barometerCoverage(points: TrailPoint[]) {
  const usable = points.filter(isUsableForDistance);
  if (usable.length === 0) return 0;
  const withReading = usable.filter(point => point.relativeAltitude !== null);
  return withReading.length / usable.length;
}

/**
 * One elevation source for the whole session: barometer when it covers at
 * least MIN_BAROMETER_COVERAGE of the usable fixes, otherwise GPS altitude.
 */
export function chooseElevationSource(points: TrailPoint[]): ElevationSource {
  return barometerCoverage(points) >= MIN_BAROMETER_COVERAGE
    ? 'barometer'
    : 'gps';
}

/** Least-squares slope (rise over run) of distance/elevation pairs. */
export function leastSquaresSlope(
  samples: { distance: number; elevation: number }[],
) {
  const count = samples.length;
  if (count < 2) return null;
  const meanDistance = samples.reduce((sum, s) => sum + s.distance, 0) / count;
  const meanElevation =
    samples.reduce((sum, s) => sum + s.elevation, 0) / count;

  let covariance = 0;
  let distanceVariance = 0;
  samples.forEach(sample => {
    const distanceOffset = sample.distance - meanDistance;
    covariance += distanceOffset * (sample.elevation - meanElevation);
    distanceVariance += distanceOffset ** 2;
  });
  return distanceVariance === 0 ? null : covariance / distanceVariance;
}

/**
 * Least-squares slope of elevation against travelled distance, using the
 * accurate fixes from the most recent grade window of travel. The window
 * starts at the latest accurate fix that is at least that far back, so the
 * span always covers the full window. Barometric height is used when the
 * current fix has it, with a shorter window than GPS altitude needs.
 */
export function calculateRollingGrade(
  points: TrailPoint[],
): GradeEstimate | null {
  const currentPoint = points.at(-1);
  if (!currentPoint) return null;
  const source: ElevationSource =
    currentPoint.relativeAltitude !== null ? 'barometer' : 'gps';
  const { maxWindowMeters, minPoints, windowMeters } = GRADE_WINDOWS[source];
  const currentElevation = elevationFrom(currentPoint, source);
  if (currentElevation === null) return null;

  const currentDistance = currentPoint.cumulativeDistanceMeters;
  const windowSamples: { distance: number; elevation: number }[] = [];

  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    const distanceBack = currentDistance - point.cumulativeDistanceMeters;
    if (distanceBack > maxWindowMeters) break;
    const elevation = elevationFrom(point, source);
    if (elevation === null) continue;

    windowSamples.push({ distance: point.cumulativeDistanceMeters, elevation });
    if (distanceBack >= windowMeters) break;
  }

  const firstSample = windowSamples.at(-1);
  if (!firstSample || windowSamples.length < minPoints) return null;

  const windowDistanceMeters = currentDistance - firstSample.distance;
  if (windowDistanceMeters < windowMeters) return null;

  const slope = leastSquaresSlope(windowSamples);
  if (slope === null) return null;

  return { percent: slope * 100, source, windowDistanceMeters };
}

export function locationToTrailPoint(
  location: LocationObject,
  cumulativeDistanceMeters: number,
  relativeAltitude: number | null = null,
): TrailPoint {
  return {
    altitude: location.coords.altitude,
    altitudeAccuracy: location.coords.altitudeAccuracy,
    capturedAt: new Date(location.timestamp).toISOString(),
    cumulativeDistanceMeters,
    gradePercent: null,
    gradeWindowDistanceMeters: null,
    heading: location.coords.heading,
    horizontalAccuracy: location.coords.accuracy,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    relativeAltitude,
    speed: location.coords.speed,
  };
}

/**
 * Adds a fix to the track. Distance only accumulates between accurate fixes,
 * and only once the movement exceeds the fixes' combined uncertainty, so GPS
 * jitter while stationary is not counted as travel. The fix is pushed onto
 * track.points in place, so a long recording is not copied on every fix.
 */
export function appendTrailPoint(
  track: TrailTrack,
  location: LocationObject,
  relativeAltitude: number | null = null,
): TrailTrack {
  const origin = track.lastTravelPoint;
  const candidate = locationToTrailPoint(
    location,
    origin?.cumulativeDistanceMeters ?? 0,
    relativeAltitude,
  );
  let lastTravelPoint = origin;

  if (isUsableForDistance(candidate)) {
    if (!origin) {
      lastTravelPoint = candidate;
    } else {
      const movement = distanceBetweenPoints(origin, candidate);
      const requiredMovement = Math.max(
        MIN_TRAVEL_STEP_METERS,
        ((origin.horizontalAccuracy ?? 0) +
          (candidate.horizontalAccuracy ?? 0)) /
          2,
      );
      if (movement >= requiredMovement) {
        candidate.cumulativeDistanceMeters =
          origin.cumulativeDistanceMeters + movement;
        lastTravelPoint = candidate;
      }
    }
  }

  const { points } = track;
  points.push(candidate);
  const grade = calculateRollingGrade(points);
  candidate.gradePercent = grade?.percent ?? null;
  candidate.gradeWindowDistanceMeters = grade?.windowDistanceMeters ?? null;

  return { lastTravelPoint, points };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableFinite(value: unknown) {
  return value === null || isFiniteNumber(value);
}

function isTimestamp(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isTrailPoint(value: unknown): value is TrailPoint {
  if (typeof value !== 'object' || value === null) return false;
  const point = value as Record<string, unknown>;
  return (
    isFiniteNumber(point.latitude) &&
    Math.abs(point.latitude) <= 90 &&
    isFiniteNumber(point.longitude) &&
    Math.abs(point.longitude) <= 180 &&
    isFiniteNumber(point.cumulativeDistanceMeters) &&
    point.cumulativeDistanceMeters >= 0 &&
    isTimestamp(point.capturedAt) &&
    isNullableFinite(point.altitude) &&
    isNullableFinite(point.altitudeAccuracy) &&
    isNullableFinite(point.horizontalAccuracy) &&
    isNullableFinite(point.gradePercent) &&
    isNullableFinite(point.gradeWindowDistanceMeters) &&
    isNullableFinite(point.heading) &&
    isNullableFinite(point.speed) &&
    // Profiles saved before barometer support have no relativeAltitude.
    (point.relativeAltitude === undefined ||
      isNullableFinite(point.relativeAltitude))
  );
}

function isLevelReading(value: unknown): value is LevelReading {
  if (typeof value !== 'object' || value === null) return false;
  const reading = value as Record<string, unknown>;
  return (
    isTimestamp(reading.capturedAt) &&
    isFiniteNumber(reading.crossSlopePercent) &&
    reading.crossSlopePercent >= 0 &&
    isFiniteNumber(reading.distanceMeters) &&
    reading.distanceMeters >= 0 &&
    isFiniteNumber(reading.runningSlopePercent) &&
    reading.runningSlopePercent >= 0
  );
}

function hasIncreasingDistance(points: TrailPoint[]) {
  return points.every(
    (point, index) =>
      index === 0 ||
      point.cumulativeDistanceMeters >=
        points[index - 1].cumulativeDistanceMeters,
  );
}

export function isTrailSession(value: unknown): value is TrailSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Record<string, unknown>;
  return (
    isTimestamp(session.recordedAt) &&
    isTimestamp(session.endedAt) &&
    isFiniteNumber(session.totalDistanceMeters) &&
    session.totalDistanceMeters >= 0 &&
    Array.isArray(session.points) &&
    session.points.every(isTrailPoint) &&
    hasIncreasingDistance(session.points) &&
    (session.levelReadings === undefined ||
      (Array.isArray(session.levelReadings) &&
        session.levelReadings.every(isLevelReading)))
  );
}

/** Fills in fields that older saved profiles do not have. */
export function withCurrentFields(session: TrailSession): TrailSession {
  return {
    ...session,
    levelReadings: session.levelReadings ?? [],
    points: session.points.map(point => ({
      ...point,
      relativeAltitude: point.relativeAltitude ?? null,
    })),
  };
}

/** Parses legacy stored sessions, dropping any entry that is not valid. */
export function parseTrailSessions(stored: string | null): TrailSession[] {
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  return Array.isArray(parsed)
    ? parsed.filter(isTrailSession).map(withCurrentFields)
    : [];
}
