import { sessionFrom, walk } from '@/test-utils/trailFixtures';
import {
  chooseElevationSource,
  isTrailSession,
  isUsableForDistance,
  TrailPoint,
} from '@/utils/trail';

describe('chooseElevationSource', () => {
  it('uses the barometer when every fix has a reading', () => {
    const points = walk({ lengthMeters: 100, relativeAltitude: () => 0 });
    expect(chooseElevationSource(points)).toBe('barometer');
  });

  it('falls back to GPS when barometer readings are missing', () => {
    // The barometer starts late, so the first 20% has no readings.
    const points = walk({
      lengthMeters: 100,
      relativeAltitude: distance => (distance < 20 ? null : 0),
    });
    expect(chooseElevationSource(points)).toBe('gps');
  });

  it('uses GPS without any barometer readings', () => {
    expect(chooseElevationSource(walk({ lengthMeters: 50 }))).toBe('gps');
  });
});

describe('isUsableForDistance', () => {
  const point = walk({ lengthMeters: 1 })[0];

  it.each([
    [0, true],
    [5, true],
    [20, true],
    [21, false],
    [-1, false],
    [null, false],
    [Number.NaN, false],
  ])('horizontal accuracy %p is usable: %p', (accuracy, usable) => {
    expect(
      isUsableForDistance({ ...point, horizontalAccuracy: accuracy }),
    ).toBe(usable);
  });
});

describe('isTrailSession', () => {
  const points = walk({ lengthMeters: 20 });
  const valid = sessionFrom(points);
  const withPoint = (index: number, change: Partial<TrailPoint>) =>
    sessionFrom(
      points.map((point, at) =>
        at === index ? { ...point, ...change } : point,
      ),
    );

  it('accepts a recorded session', () => {
    expect(isTrailSession(valid)).toBe(true);
  });

  it('rejects invalid timestamps', () => {
    expect(isTrailSession({ ...valid, recordedAt: 'yesterday' })).toBe(false);
    expect(isTrailSession(withPoint(3, { capturedAt: 'not a date' }))).toBe(
      false,
    );
  });

  it('rejects non-finite or out-of-range numbers', () => {
    expect(isTrailSession(withPoint(2, { latitude: Number.NaN }))).toBe(false);
    expect(isTrailSession(withPoint(2, { latitude: 91 }))).toBe(false);
    expect(isTrailSession(withPoint(2, { longitude: -181 }))).toBe(false);
    expect(isTrailSession(withPoint(2, { altitude: Infinity }))).toBe(false);
    expect(isTrailSession({ ...valid, totalDistanceMeters: -1 })).toBe(false);
  });

  it('rejects distance that goes backwards', () => {
    const last = points.length - 1;
    expect(
      isTrailSession(withPoint(last, { cumulativeDistanceMeters: 0 })),
    ).toBe(false);
  });
});
