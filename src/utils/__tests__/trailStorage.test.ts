import { MemoryStore, sessionFrom, walk } from '@/test-utils/trailFixtures';
import {
  LEGACY_TRAIL_PROFILE_STORAGE_KEY,
  MAX_TRAIL_SESSIONS,
} from '@/utils/trail';
import {
  decodeSession,
  encodeSession,
  loadTrailSession,
  loadTrailSessionIndex,
  MAX_SESSION_BYTES,
  saveTrailSession,
  sessionId,
  TRAIL_INDEX_STORAGE_KEY,
} from '@/utils/trailStorage';

const HOUR_MS = 3_600_000;
const BASE_MS = Date.parse('2026-10-01T16:00:00.000Z');

function sessionAt(hour: number, lengthMeters = 30) {
  return sessionFrom(
    walk({
      lengthMeters,
      relativeAltitude: distance => distance * 0.02,
      startMs: BASE_MS + hour * HOUR_MS,
    }),
    [],
  );
}

describe('encodeSession / decodeSession', () => {
  it('round-trips a session to within sensor precision', () => {
    const session = sessionAt(0);
    const decoded = decodeSession(encodeSession(session));
    expect(decoded).not.toBeNull();
    expect(decoded!.points).toHaveLength(session.points.length);
    decoded!.points.forEach((point, index) => {
      const original = session.points[index];
      expect(point.capturedAt).toBe(original.capturedAt);
      expect(point.latitude).toBeCloseTo(original.latitude, 6);
      expect(point.cumulativeDistanceMeters).toBeCloseTo(
        original.cumulativeDistanceMeters,
        1,
      );
      expect(point.relativeAltitude).toBeCloseTo(original.relativeAltitude!, 1);
    });
  });

  it('thins a session that is over the size budget, keeping the end', () => {
    const session = sessionAt(0, 40_000);
    const encoded = encodeSession(session);
    expect(encoded.length).toBeLessThanOrEqual(MAX_SESSION_BYTES);
    expect(JSON.parse(encoded).thinnedFrom).toBe(session.points.length);
    const decoded = decodeSession(encoded)!;
    expect(decoded.points.length).toBeLessThan(session.points.length);
    expect(decoded.points.at(-1)?.capturedAt).toBe(
      session.points.at(-1)?.capturedAt,
    );
  });

  it('returns null for corrupt data', () => {
    expect(decodeSession('{not json')).toBeNull();
    expect(
      decodeSession(JSON.stringify({ version: 2, points: [] })),
    ).toBeNull();
    const encoded = JSON.parse(encodeSession(sessionAt(0)));
    encoded.points[1][1] = 'north';
    expect(decodeSession(JSON.stringify(encoded))).toBeNull();
  });
});

describe('saveTrailSession', () => {
  it('lists newest first and keeps only the most recent sessions', async () => {
    const store = new MemoryStore();
    const sessions = Array.from({ length: MAX_TRAIL_SESSIONS + 2 }, (_, hour) =>
      sessionAt(hour),
    );
    for (const session of sessions) await saveTrailSession(store, session);

    const index = await loadTrailSessionIndex(store);
    expect(index).toHaveLength(MAX_TRAIL_SESSIONS);
    expect(index[0].id).toBe(sessionId(sessions.at(-1)!));
    // The two oldest sessions are removed from storage, not just the index.
    expect(await loadTrailSession(store, sessionId(sessions[0]))).toBeNull();
    expect(await loadTrailSession(store, sessionId(sessions[1]))).toBeNull();
    expect(store.items.size).toBe(MAX_TRAIL_SESSIONS + 1);
  });

  it('leaves the index untouched when the session write fails', async () => {
    const store = new MemoryStore();
    await saveTrailSession(store, sessionAt(0));
    const before = store.items.get(TRAIL_INDEX_STORAGE_KEY);

    store.setItem = async () => {
      throw new Error('Disk full');
    };
    await expect(saveTrailSession(store, sessionAt(1))).rejects.toThrow(
      'Disk full',
    );
    expect(store.items.get(TRAIL_INDEX_STORAGE_KEY)).toBe(before);
  });
});

describe('loadTrailSessionIndex', () => {
  it('migrates sessions from the legacy single key', async () => {
    const store = new MemoryStore();
    const newest = sessionAt(2);
    const oldest = sessionAt(1);
    await store.setItem(
      LEGACY_TRAIL_PROFILE_STORAGE_KEY,
      JSON.stringify([newest, oldest]),
    );

    const index = await loadTrailSessionIndex(store);
    expect(index.map(entry => entry.id)).toEqual([
      sessionId(newest),
      sessionId(oldest),
    ]);
    expect(store.items.has(LEGACY_TRAIL_PROFILE_STORAGE_KEY)).toBe(false);
    const loaded = await loadTrailSession(store, sessionId(newest));
    expect(loaded?.points).toHaveLength(newest.points.length);
  });

  it('starts empty with no saved data', async () => {
    const store = new MemoryStore();
    expect(await loadTrailSessionIndex(store)).toEqual([]);
    expect(store.items.get(TRAIL_INDEX_STORAGE_KEY)).toBe('[]');
  });
});
