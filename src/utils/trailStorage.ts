import {
  isTrailSession,
  LEGACY_TRAIL_PROFILE_STORAGE_KEY,
  MAX_TRAIL_SESSIONS,
  parseTrailSessions,
  TrailPoint,
  TrailSession,
  withCurrentFields,
} from '@/utils/trail';

/**
 * Trail profiles are stored one session per key, with a small index of
 * summaries. A large write can then only ever affect its own session, and
 * the list of profiles loads without reading every point.
 */
export const TRAIL_INDEX_STORAGE_KEY = 'trail-profiles-index';
const SESSION_KEY_PREFIX = 'trail-profile:';
/** Largest stored session. A 10,000-fix session encodes to about 1 MB. */
export const MAX_SESSION_BYTES = 2_000_000;

/** The part of AsyncStorage this module uses, so tests can pass a fake. */
export type KeyValueStore = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type TrailSessionSummary = {
  endedAt: string;
  id: string;
  pointCount: number;
  recordedAt: string;
  totalDistanceMeters: number;
};

/** Column order of each encoded point. */
const POINT_FIELDS = [
  'timeOffsetMs',
  'latitude',
  'longitude',
  'altitude',
  'altitudeAccuracy',
  'horizontalAccuracy',
  'relativeAltitude',
  'cumulativeDistanceMeters',
  'gradePercent',
  'gradeWindowDistanceMeters',
  'heading',
  'speed',
] as const;

type CompactSession = {
  endedAt: string;
  fields: readonly string[];
  levelReadings: TrailSession['levelReadings'];
  points: (number | null)[][];
  recordedAt: string;
  /** Raw fix count before thinning to fit MAX_SESSION_BYTES, if thinned. */
  thinnedFrom?: number;
  totalDistanceMeters: number;
  version: 1;
};

function sessionKey(id: string) {
  return `${SESSION_KEY_PREFIX}${id}`;
}

export function sessionId(session: TrailSession) {
  return String(Date.parse(session.recordedAt));
}

function round(value: number | null, decimals: number) {
  if (value === null) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function encodePoint(point: TrailPoint, startMs: number) {
  return [
    Date.parse(point.capturedAt) - startMs,
    round(point.latitude, 7),
    round(point.longitude, 7),
    round(point.altitude, 2),
    round(point.altitudeAccuracy, 1),
    round(point.horizontalAccuracy, 1),
    round(point.relativeAltitude, 2),
    round(point.cumulativeDistanceMeters, 2),
    round(point.gradePercent, 2),
    round(point.gradeWindowDistanceMeters, 1),
    round(point.heading, 1),
    round(point.speed, 2),
  ];
}

/** Keeps every other fix, always keeping the last one. */
function thin(points: TrailPoint[]) {
  const kept = points.filter((_, index) => index % 2 === 0);
  const last = points.at(-1);
  if (last && kept.at(-1) !== last) kept.push(last);
  return kept;
}

/**
 * Compact JSON for one session, thinned until it fits MAX_SESSION_BYTES.
 * Numbers are rounded well below GPS and barometer precision.
 */
export function encodeSession(session: TrailSession) {
  const startMs = Date.parse(session.recordedAt);
  let points = session.points;
  for (;;) {
    const compact: CompactSession = {
      endedAt: session.endedAt,
      fields: POINT_FIELDS,
      levelReadings: session.levelReadings,
      points: points.map(point => encodePoint(point, startMs)),
      recordedAt: session.recordedAt,
      totalDistanceMeters: session.totalDistanceMeters,
      version: 1,
      ...(points.length < session.points.length
        ? { thinnedFrom: session.points.length }
        : {}),
    };
    const json = JSON.stringify(compact);
    if (json.length <= MAX_SESSION_BYTES || points.length <= 2) return json;
    points = thin(points);
  }
}

function decodePoint(row: unknown, startMs: number): TrailPoint | null {
  if (!Array.isArray(row) || row.length !== POINT_FIELDS.length) return null;
  const [
    timeOffsetMs,
    latitude,
    longitude,
    altitude,
    altitudeAccuracy,
    horizontalAccuracy,
    relativeAltitude,
    cumulativeDistanceMeters,
    gradePercent,
    gradeWindowDistanceMeters,
    heading,
    speed,
  ] = row as (number | null)[];
  if (timeOffsetMs === null || latitude === null || longitude === null)
    return null;
  if (cumulativeDistanceMeters === null) return null;
  return {
    altitude,
    altitudeAccuracy,
    capturedAt: new Date(startMs + timeOffsetMs).toISOString(),
    cumulativeDistanceMeters,
    gradePercent,
    gradeWindowDistanceMeters,
    heading,
    horizontalAccuracy,
    latitude,
    longitude,
    relativeAltitude,
    speed,
  };
}

/** Parses one stored session, or null if it is missing or invalid. */
export function decodeSession(stored: string | null): TrailSession | null {
  if (!stored) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const compact = parsed as Partial<CompactSession>;
  if (compact.version !== 1 || !Array.isArray(compact.points)) return null;
  if (typeof compact.recordedAt !== 'string') return null;

  const startMs = Date.parse(compact.recordedAt);
  const points = compact.points.map(row => decodePoint(row, startMs));
  if (points.some(point => point === null)) return null;

  const session = {
    endedAt: compact.endedAt,
    levelReadings: compact.levelReadings ?? [],
    points,
    recordedAt: compact.recordedAt,
    totalDistanceMeters: compact.totalDistanceMeters,
  };
  return isTrailSession(session) ? withCurrentFields(session) : null;
}

function summarize(session: TrailSession): TrailSessionSummary {
  return {
    endedAt: session.endedAt,
    id: sessionId(session),
    pointCount: session.points.length,
    recordedAt: session.recordedAt,
    totalDistanceMeters: session.totalDistanceMeters,
  };
}

function isSummary(value: unknown): value is TrailSessionSummary {
  if (typeof value !== 'object' || value === null) return false;
  const summary = value as Record<string, unknown>;
  return (
    typeof summary.id === 'string' &&
    typeof summary.recordedAt === 'string' &&
    typeof summary.endedAt === 'string' &&
    typeof summary.pointCount === 'number' &&
    typeof summary.totalDistanceMeters === 'number'
  );
}

async function readIndex(store: KeyValueStore) {
  const stored = await store.getItem(TRAIL_INDEX_STORAGE_KEY);
  if (stored === null) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isSummary) : [];
  } catch {
    return [];
  }
}

/** Stores a session under its own key, then lists it first in the index. */
export async function saveTrailSession(
  store: KeyValueStore,
  session: TrailSession,
): Promise<TrailSessionSummary[]> {
  const summary = summarize(session);
  // Write the session first: if this fails, the index and history are intact.
  await store.setItem(sessionKey(summary.id), encodeSession(session));

  const previous = (await readIndex(store)) ?? [];
  const updated = [
    summary,
    ...previous.filter(entry => entry.id !== summary.id),
  ];
  const kept = updated.slice(0, MAX_TRAIL_SESSIONS);
  await store.setItem(TRAIL_INDEX_STORAGE_KEY, JSON.stringify(kept));

  await Promise.all(
    updated
      .slice(MAX_TRAIL_SESSIONS)
      .map(entry => store.removeItem(sessionKey(entry.id))),
  );
  return kept;
}

/** Moves sessions from the original single-key format into per-session keys. */
async function migrateLegacy(store: KeyValueStore) {
  const legacy = await store.getItem(LEGACY_TRAIL_PROFILE_STORAGE_KEY);
  let sessions: TrailSession[] = [];
  try {
    sessions = parseTrailSessions(legacy);
  } catch {
    sessions = [];
  }
  // Oldest first, so the newest ends up first in the index.
  for (const session of [...sessions].reverse()) {
    await saveTrailSession(store, session);
  }
  if (sessions.length === 0)
    await store.setItem(TRAIL_INDEX_STORAGE_KEY, JSON.stringify([]));
  if (legacy !== null) await store.removeItem(LEGACY_TRAIL_PROFILE_STORAGE_KEY);
}

/** Saved session summaries, newest first. */
export async function loadTrailSessionIndex(
  store: KeyValueStore,
): Promise<TrailSessionSummary[]> {
  const index = await readIndex(store);
  if (index !== null) return index;
  await migrateLegacy(store);
  return (await readIndex(store)) ?? [];
}

export async function loadTrailSession(
  store: KeyValueStore,
  id: string,
): Promise<TrailSession | null> {
  return decodeSession(await store.getItem(sessionKey(id)));
}
