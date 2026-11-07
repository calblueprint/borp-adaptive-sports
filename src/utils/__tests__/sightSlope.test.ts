import type { LockedSight, Vector3 } from '@/utils/sightSlope';
import {
  assessSight,
  cameraElevationDegrees,
  gravityFromMotion,
  oneWayGrade,
  twoWayGrade,
} from '@/utils/sightSlope';

const GRAVITY = 9.81;
const DEGREES = 180 / Math.PI;

/**
 * Down-pointing gravity, in the phone's axes, for a phone held upright with
 * the back camera at this angle above the horizon and rolled around the
 * camera axis by `rollDegrees`.
 */
function gravityFor(elevationDegrees: number, rollDegrees = 0): Vector3 {
  const e = elevationDegrees / DEGREES;
  const r = rollDegrees / DEGREES;
  return {
    x: -Math.cos(e) * Math.sin(r) * GRAVITY,
    y: -Math.cos(e) * Math.cos(r) * GRAVITY,
    z: Math.sin(e) * GRAVITY,
  };
}

/** Samples around an angle, with seeded jitter in degrees. */
function samplesAt(elevationDegrees: number, jitterDegrees = 0, count = 20) {
  let seed = 7;
  const noise = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };
  return Array.from({ length: count }, () =>
    gravityFor(elevationDegrees + noise() * jitterDegrees),
  );
}

function sight(elevationDegrees: number, spreadDegrees = 0.1): LockedSight {
  return { elevationDegrees, sampleCount: 20, spreadDegrees };
}

/** Angle from a phone at height h to a marker at height t, x and y away. */
function sightAngle(rise: number, run: number, phone: number, marker: number) {
  return Math.atan((rise + marker - phone) / run) * DEGREES;
}

describe('cameraElevationDegrees', () => {
  it.each([
    [0, 0],
    [4.57, 0],
    [-6, 0],
    [10, 25],
    [-3, -40],
  ])('reads %p° whatever the roll (%p°)', (elevation, roll) => {
    expect(cameraElevationDegrees(gravityFor(elevation, roll))).toBeCloseTo(
      elevation,
      6,
    );
  });

  it('reads a phone lying screen up as the camera pointing straight down', () => {
    expect(cameraElevationDegrees({ x: 0, y: 0, z: -GRAVITY })).toBeCloseTo(
      -90,
    );
  });

  it('returns null without a gravity reading', () => {
    expect(cameraElevationDegrees({ x: 0, y: 0, z: 0 })).toBeNull();
  });
});

describe('gravityFromMotion', () => {
  it('removes the hand acceleration', () => {
    expect(
      gravityFromMotion({
        acceleration: { x: 0.5, y: -0.2, z: 0.1 },
        accelerationIncludingGravity: { x: 0.5, y: -10.01, z: 0.1 },
      }),
    ).toEqual({ x: 0, y: -9.81, z: 0 });
  });

  it('falls back to the raw reading without user acceleration', () => {
    const raw = { x: 0, y: -9.81, z: 1 };
    expect(
      gravityFromMotion({
        acceleration: null,
        accelerationIncludingGravity: raw,
      }),
    ).toBe(raw);
  });
});

describe('assessSight', () => {
  it('is steady and accurate with ordinary hand tremor', () => {
    const assessment = assessSight(samplesAt(3.2, 0.15), false);
    expect(assessment?.steady).toBe(true);
    expect(assessment?.elevationDegrees).toBeCloseTo(3.2, 1);
  });

  it('is not steady while the phone swings', () => {
    expect(assessSight(samplesAt(3.2, 1.5), false)?.steady).toBe(false);
  });

  it('stays steady through a little more wobble once steady', () => {
    const samples = samplesAt(3.2, 0.5);
    expect(assessSight(samples, false)?.steady).toBe(false);
    expect(assessSight(samples, true)?.steady).toBe(true);
  });

  it('is not usable when the camera points at the sky or the feet', () => {
    const assessment = assessSight(samplesAt(-60), false);
    expect(assessment?.usable).toBe(false);
    expect(assessment?.steady).toBe(false);
  });

  it('needs more than one sample', () => {
    expect(assessSight(samplesAt(0, 0, 1), false)).toBeNull();
  });
});

describe('twoWayGrade', () => {
  const run = 10;

  it.each([
    // grade %, phone height, marker height, phone angle offset
    [8, 1.45, 1.45, 0],
    [8, 1.45, 1.45, 0.8],
    [-5, 1.5, 1.5, -1.2],
    [8, 1.45, 0, 1],
    [12, 1.3, 0, -0.7],
    [-8.33, 1.6, 0.3, 0.5],
    [2, 1.45, 1.0, 0],
  ])(
    'recovers %p%% (phone %p m, marker %p m, offset %p°)',
    (grade, phone, marker, offset) => {
      const rise = (run * grade) / 100;
      const fore = sightAngle(rise, run, phone, marker) + offset;
      const back = sightAngle(-rise, run, phone, marker) + offset;
      const result = twoWayGrade(
        sight(fore),
        sight(back),
        marker === phone ? 'phone' : 'ground',
      );
      // A one-degree offset leaves well under 0.1 points of error.
      expect(Math.abs(result.gradePercent - grade)).toBeLessThan(0.1);
    },
  );

  it('measures the phone angle offset with markers at phone height', () => {
    const rise = 0.8;
    const result = twoWayGrade(
      sight(sightAngle(rise, run, 1.45, 1.45) + 0.6),
      sight(sightAngle(-rise, run, 1.45, 1.45) + 0.6),
      'phone',
    );
    expect(result.offsetDegrees).toBeCloseTo(0.6, 6);
    expect(result.warnings).toEqual([]);
  });

  it('gives an uncertainty of a few tenths of a percent', () => {
    const result = twoWayGrade(sight(4.57), sight(-4.57), 'phone');
    expect(result.uncertaintyPercent).toBeGreaterThan(0.2);
    expect(result.uncertaintyPercent).toBeLessThan(0.4);
  });

  it('warns when fore and back sights do not mirror each other', () => {
    const result = twoWayGrade(sight(6), sight(-1), 'phone');
    expect(result.warnings).toHaveLength(1);
  });

  it('warns when ground-marker sights point upward', () => {
    const result = twoWayGrade(sight(3), sight(1), 'ground');
    expect(result.offsetDegrees).toBeNull();
    expect(result.warnings).toHaveLength(1);
  });

  it('warns when stations are close together', () => {
    const result = twoWayGrade(
      sight(sightAngle(0.1, 2, 1.45, 0)),
      sight(sightAngle(-0.1, 2, 1.45, 0)),
      'ground',
    );
    expect(result.warnings.some(w => w.includes('5 to 15 m'))).toBe(true);
  });
});

describe('oneWayGrade', () => {
  it('reads tan of the angle', () => {
    expect(oneWayGrade(sight(4.574), null).gradePercent).toBeCloseTo(8, 2);
  });

  it('corrects by a known offset and is then more certain', () => {
    const calibrated = oneWayGrade(sight(5.374), 0.8);
    const uncalibrated = oneWayGrade(sight(5.374), null);
    expect(calibrated.gradePercent).toBeCloseTo(8, 2);
    expect(calibrated.uncertaintyPercent).toBeLessThan(
      uncalibrated.uncertaintyPercent,
    );
  });
});
