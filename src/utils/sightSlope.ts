/**
 * Slope from sighting along the trail with the camera, the way a surveyor
 * uses a hand clinometer (Abney level), with the phone held in the hand.
 *
 * The back camera's optical axis points straight out of the back of the
 * phone, so the angle of that axis above or below the horizon comes straight
 * from the gravity vector. Put the on-screen crosshair on a marker up the
 * trail and that angle is the sight-line angle.
 *
 * One-way sight: if the marker is at the same height above the trail as the
 * phone (a partner's eye level, or a mark on a pole), the sight line runs
 * parallel to the trail and grade = tan(angle).
 *
 * Two-way sight: sight from station A to a marker at B, walk to B, and sight
 * back to an identical marker at A. With phone height h, marker height t,
 * horizontal run x and rise y:
 *
 *   tan(fore) = ( y + t - h) / x
 *   tan(back) = (-y + t - h) / x
 *
 * so grade = y / x = (tan(fore) - tan(back)) / 2, whatever h and t are, as
 * long as they are the same at both ends. Any fixed offset between the
 * sensor and the camera adds to both angles and cancels in the difference,
 * so the two-way result needs no calibration.
 */

export type Vector3 = { x: number; y: number; z: number };

/** The parts of a DeviceMotion event this module reads. */
export type MotionVectors = {
  acceleration: Vector3 | null;
  accelerationIncludingGravity: Vector3 | null;
};

export type SightAssessment = {
  /** Camera axis angle above (+) or below (−) the horizon, in degrees. */
  elevationDegrees: number;
  /** Standard deviation of the samples in the window, in degrees. */
  spreadDegrees: number;
  /** True once the phone is held still enough to lock the sight. */
  steady: boolean;
  /** False when the camera points too far up or down to sight along a trail. */
  usable: boolean;
};

export type LockedSight = {
  elevationDegrees: number;
  /** How many samples were averaged. */
  sampleCount: number;
  spreadDegrees: number;
};

export type MarkerHeight = 'phone' | 'ground';

export type TwoWayResult = {
  /** Rise over run between the stations, in percent. Positive is uphill. */
  gradePercent: number;
  /** Estimated one-sigma uncertainty of the grade, in percentage points. */
  uncertaintyPercent: number;
  /**
   * With markers at phone height the fore and back angles should be equal
   * and opposite; half their sum is the phone's own angle offset. Null for
   * ground markers, where the two angles differ by design.
   */
  offsetDegrees: number | null;
  warnings: string[];
};

const DEGREES = 180 / Math.PI;

/** Readings beyond this angle are not a sight along a walkable trail. */
export const MAX_SIGHT_ELEVATION_DEGREES = 40;
/**
 * Hand-held, the camera axis wobbles by a tenth or two of a degree. A sight
 * locks while the window's spread stays under this.
 */
export const STEADY_SPREAD_DEGREES = 0.25;
/** A steady sight stays steady until the spread passes this. */
export const UNSTEADY_SPREAD_DEGREES = 0.4;
/** Most the window's halves may disagree for the sight to count as steady. */
export const STEADY_DRIFT_DEGREES = 0.15;
export const UNSTEADY_DRIFT_DEGREES = 0.25;
/**
 * How precisely a person can hold a crosshair on a marker, in degrees. It
 * sets a floor on the uncertainty, since sample noise alone averages away.
 */
export const AIMING_ERROR_DEGREES = 0.2;
/** Angle offsets larger than this suggest the markers or aim differed. */
export const MAX_PLAUSIBLE_OFFSET_DEGREES = 1.5;
/** Steeper sights mean the stations are close together, so less precise. */
export const STEEP_SIGHT_WARNING_DEGREES = 20;

/**
 * Gravity in the phone's own axes, pointing down. Both platforms' Expo
 * modules report accelerationIncludingGravity pointing down (iOS passes
 * CoreMotion's gravity through; Android subtracts twice the gravity sensor).
 * Subtracting the user acceleration leaves the sensor-fused gravity estimate,
 * which hand shake disturbs far less than the raw accelerometer.
 */
export function gravityFromMotion({
  acceleration,
  accelerationIncludingGravity,
}: MotionVectors): Vector3 | null {
  if (!accelerationIncludingGravity) return null;
  if (!acceleration) return accelerationIncludingGravity;
  return {
    x: accelerationIncludingGravity.x - acceleration.x,
    y: accelerationIncludingGravity.y - acceleration.y,
    z: accelerationIncludingGravity.z - acceleration.z,
  };
}

/**
 * Angle of the back camera's axis above the horizon, in degrees. The axis is
 * the phone's −z direction and "up" is −gravity, so the sine of the angle is
 * gravity's z share. Rolling the phone around the axis does not change it.
 */
export function cameraElevationDegrees({ x, y, z }: Vector3): number | null {
  const magnitude = Math.hypot(x, y, z);
  if (magnitude === 0) return null;
  return Math.asin(Math.max(-1, Math.min(1, z / magnitude))) * DEGREES;
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  const average = mean(values);
  return Math.sqrt(mean(values.map(value => (value - average) ** 2)));
}

function drift(values: number[]) {
  const half = Math.floor(values.length / 2);
  return Math.abs(mean(values.slice(half)) - mean(values.slice(0, half)));
}

/**
 * Averages a window of gravity samples into a sight angle and decides
 * whether the phone is still enough to lock it. Once steady, looser limits
 * keep it steady so the state does not flicker from ordinary hand tremor.
 */
export function assessSight(
  samples: Vector3[],
  wasSteady: boolean,
): SightAssessment | null {
  const angles = samples
    .map(cameraElevationDegrees)
    .filter((angle): angle is number => angle !== null);
  if (angles.length < 2) return null;

  const elevationDegrees = mean(angles);
  const spreadDegrees = standardDeviation(angles);
  const usable = Math.abs(elevationDegrees) <= MAX_SIGHT_ELEVATION_DEGREES;
  const maxSpread = wasSteady ? UNSTEADY_SPREAD_DEGREES : STEADY_SPREAD_DEGREES;
  const maxDrift = wasSteady ? UNSTEADY_DRIFT_DEGREES : STEADY_DRIFT_DEGREES;

  return {
    elevationDegrees,
    spreadDegrees,
    steady: usable && spreadDegrees <= maxSpread && drift(angles) <= maxDrift,
    usable,
  };
}

function tanDegrees(degrees: number) {
  return Math.tan(degrees / DEGREES);
}

/** Grade, in percent, of a sight line at this angle. */
export function gradeFromElevation(elevationDegrees: number) {
  return tanDegrees(elevationDegrees) * 100;
}

/** One sight's angle uncertainty: aiming error plus sample noise. */
function sightSigmaRadians(sight: LockedSight) {
  const noise = sight.spreadDegrees / Math.sqrt(Math.max(sight.sampleCount, 1));
  return Math.hypot(AIMING_ERROR_DEGREES, noise) / DEGREES;
}

/** d(tan θ)/dθ, to carry an angle error into a grade error. */
function secantSquared(degrees: number) {
  return 1 / Math.cos(degrees / DEGREES) ** 2;
}

/**
 * One-way grade, corrected by a calibration offset if one is known. Without
 * an offset it is only as good as the phone's angle offset, which is often
 * half a degree or more (about 1% grade).
 */
export function oneWayGrade(
  sight: LockedSight,
  offsetDegrees: number | null,
): { gradePercent: number; uncertaintyPercent: number } {
  const corrected = sight.elevationDegrees - (offsetDegrees ?? 0);
  // Uncalibrated, allow a one-degree offset in the uncertainty.
  const offsetSigma = offsetDegrees === null ? 1 / DEGREES : 0;
  const sigma = Math.hypot(sightSigmaRadians(sight), offsetSigma);
  return {
    gradePercent: gradeFromElevation(corrected),
    uncertaintyPercent: secantSquared(corrected) * sigma * 100,
  };
}

/** Combines a fore sight and a back sight into the grade between stations. */
export function twoWayGrade(
  fore: LockedSight,
  back: LockedSight,
  markerHeight: MarkerHeight,
): TwoWayResult {
  const grade =
    (tanDegrees(fore.elevationDegrees) - tanDegrees(back.elevationDegrees)) / 2;
  const uncertainty =
    0.5 *
    Math.hypot(
      secantSquared(fore.elevationDegrees) * sightSigmaRadians(fore),
      secantSquared(back.elevationDegrees) * sightSigmaRadians(back),
    );

  const warnings: string[] = [];
  let offsetDegrees: number | null = null;
  if (markerHeight === 'phone') {
    offsetDegrees = (fore.elevationDegrees + back.elevationDegrees) / 2;
    if (Math.abs(offsetDegrees) > MAX_PLAUSIBLE_OFFSET_DEGREES) {
      warnings.push(
        'The fore and back sights do not mirror each other. Check that both markers are at phone height and the phone was held at the same height at both stations.',
      );
    }
  } else if (
    // With ground markers, tan(fore) + tan(back) = −2h / x, always negative.
    tanDegrees(fore.elevationDegrees) + tanDegrees(back.elevationDegrees) >=
    0
  ) {
    warnings.push(
      'Sights to markers on the ground should point downward on average. Check that both sights were aimed at the ground markers.',
    );
  }
  if (
    Math.max(Math.abs(fore.elevationDegrees), Math.abs(back.elevationDegrees)) >
    STEEP_SIGHT_WARNING_DEGREES
  ) {
    warnings.push(
      'The sights are steep, which usually means the stations are close together. Stations 5 to 15 m apart give a steadier reading.',
    );
  }

  return {
    gradePercent: grade * 100,
    offsetDegrees,
    uncertaintyPercent: uncertainty * 100,
    warnings,
  };
}
