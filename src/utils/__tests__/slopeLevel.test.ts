import type { GravitySample } from '@/utils/slopeLevel';
import { assessLevel } from '@/utils/slopeLevel';

const GRAVITY = 9.81;

/** Samples for a phone tilted to the given grades, plus seeded jitter. */
function samplesAt({
  count = 15,
  crossPercent = 0,
  jitter = 0,
  runningPercent = 0,
}: {
  count?: number;
  crossPercent?: number;
  jitter?: number;
  runningPercent?: number;
}): GravitySample[] {
  let seed = 1;
  // Deterministic noise in [-1, 1], so the tests do not flake.
  const noise = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };
  return Array.from({ length: count }, () => {
    const x = crossPercent / 100;
    const y = runningPercent / 100;
    const scale = GRAVITY / Math.hypot(x, y, 1);
    return {
      x: (x + noise() * jitter) * scale,
      y: (y + noise() * jitter) * scale,
      z: scale,
    };
  });
}

describe('assessLevel', () => {
  it('reads the slope of a phone lying still', () => {
    const result = assessLevel(
      samplesAt({ crossPercent: 2, runningPercent: 5 }),
      false,
    );
    expect(result).toEqual({
      crossSlopePercent: expect.closeTo(2, 5),
      flat: true,
      runningSlopePercent: expect.closeTo(5, 5),
      steady: true,
    });
  });

  it('is steady with ordinary accelerometer noise on the ground', () => {
    // About ±0.015 g of jitter, more than the old 0.4-point limit allowed.
    const result = assessLevel(
      samplesAt({ crossPercent: 1, jitter: 0.015, runningPercent: 4 }),
      false,
    );
    expect(result.flat && result.steady).toBe(true);
  });

  it('is not steady while the phone is moving', () => {
    const result = assessLevel(
      samplesAt({ jitter: 0.08, runningPercent: 4 }),
      false,
    );
    expect(result.flat && result.steady).toBe(false);
  });

  it('is not steady while the phone tilts slowly', () => {
    const samples = Array.from(
      { length: 15 },
      (_, i) => samplesAt({ count: 1, runningPercent: i * 0.4 })[0],
    );
    expect(assessLevel(samples, false)).toMatchObject({ steady: false });
  });

  it('stays steady through noise that would not start a steady reading', () => {
    const samples = samplesAt({ jitter: 0.035, runningPercent: 4 });
    expect(assessLevel(samples, false)).toMatchObject({ steady: false });
    expect(assessLevel(samples, true)).toMatchObject({ steady: true });
  });

  it('asks for the phone to be laid flat when it is upright', () => {
    const upright = Array.from({ length: 15 }, () => ({
      x: 0,
      y: GRAVITY,
      z: 0.5,
    }));
    expect(assessLevel(upright, false)).toEqual({ flat: false });
  });
});
