export type GravitySample = { x: number; y: number; z: number };

export type LevelAssessment =
  | { flat: false }
  | {
      flat: true;
      /** Tilt across the phone's width, as a percent grade. */
      crossSlopePercent: number;
      /** Tilt along the phone's length, as a percent grade. */
      runningSlopePercent: number;
      steady: boolean;
    };

/** The phone must lie within about 45° of flat to read slope. */
const MIN_FLATNESS = 0.7;
/**
 * Raw accelerometer samples jitter by a percent or two of grade even on a
 * table, and more in a hand. Readings count as steady while the sample spread
 * (standard deviation, in percentage points) stays under this, and the
 * averaged reading is then good to a few tenths of a percent.
 */
const STEADY_SPREAD_PERCENT = 1.5;
/** Steady readings stay steady until the spread passes this. */
const UNSTEADY_SPREAD_PERCENT = 2.5;
/** Most the window's first and second halves may disagree when steady. */
const STEADY_DRIFT_PERCENT = 1;
/** Steady readings stay steady until the halves disagree by more than this. */
const UNSTEADY_DRIFT_PERCENT = 1.5;

function slopesFor({ x, y, z }: GravitySample) {
  const flatComponent = Math.abs(z);
  return {
    cross: (Math.abs(x) / flatComponent) * 100,
    running: (Math.abs(y) / flatComponent) * 100,
  };
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  const average = mean(values);
  return Math.sqrt(mean(values.map(value => (value - average) ** 2)));
}

/** How far the average of the window's second half moved from its first. */
function drift(values: number[]) {
  const half = Math.floor(values.length / 2);
  return Math.abs(mean(values.slice(half)) - mean(values.slice(0, half)));
}

/**
 * Averages a window of gravity samples into a slope reading, and decides
 * whether the phone is resting still enough to save it. Once steady, the
 * reading uses looser limits to stay steady, so the save button does not
 * flicker off from ordinary sensor noise while it is being tapped.
 */
export function assessLevel(
  samples: GravitySample[],
  wasSteady: boolean,
): LevelAssessment {
  const average = {
    x: mean(samples.map(s => s.x)),
    y: mean(samples.map(s => s.y)),
    z: mean(samples.map(s => s.z)),
  };
  const magnitude = Math.hypot(average.x, average.y, average.z);
  if (magnitude === 0 || Math.abs(average.z) / magnitude < MIN_FLATNESS)
    return { flat: false };

  const perSample = samples.map(slopesFor);
  const maxSpread = wasSteady ? UNSTEADY_SPREAD_PERCENT : STEADY_SPREAD_PERCENT;
  const maxDrift = wasSteady ? UNSTEADY_DRIFT_PERCENT : STEADY_DRIFT_PERCENT;
  const steady = [
    perSample.map(s => s.running),
    perSample.map(s => s.cross),
  ].every(
    values =>
      standardDeviation(values) <= maxSpread && drift(values) <= maxDrift,
  );
  const { cross, running } = slopesFor(average);

  return {
    crossSlopePercent: cross,
    flat: true,
    runningSlopePercent: running,
    steady,
  };
}
