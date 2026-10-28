import {
  smoothedTrack,
  toTrackDistance,
  TrackSample,
  withElevation,
} from '@/utils/elevationProfile';
import {
  chooseElevationSource,
  ElevationSource,
  leastSquaresSlope,
  LevelReading,
  TrailPoint,
} from '@/utils/trail';

/**
 * Slope checks against the accessibility codes that apply to trails and
 * paths in California:
 * - 'trail': ABA 1017 outdoor trail standard (also used by California State
 *   Parks). Running slope segment limits, 1:8 maximum, 30% rule, cross slope.
 * - 'route': CBC 11B accessible route. Walking surfaces up to 1:20, anything
 *   steeper is a ramp (1:12 maximum, 30 in rise per run), cross slope 1:48.
 * Code limits are written in feet, so findings are reported in feet.
 */
export type AccessibilityStandard = 'trail' | 'route';
export type TrailSurface = 'natural' | 'paved';

export type AccessibilityFinding = {
  citation: string;
  endMeters: number;
  limit: string;
  measured: string;
  rule: string;
  severity: 'violation' | 'caution';
  startMeters: number;
  /** Applies to the trail as a whole rather than one stretch. */
  wholeTrail?: boolean;
};

export type AccessibilityReport = {
  /** Length of trail with a measured slope. */
  analyzedDistanceMeters: number;
  /** analyzedDistanceMeters as a share of totalDistanceMeters, 0 to 1. */
  coverage: number;
  findings: AccessibilityFinding[];
  maxSlopePercent: number | null;
  source: ElevationSource;
  /** Share of analysed length steeper than 1:12 (trail) or 1:20 (route). */
  steepShare: number;
  /** Length of the whole recorded trail, with or without elevation. */
  totalDistanceMeters: number;
  windowMeters: number;
};

export const METERS_PER_FOOT = 0.3048;
const METERS_PER_INCH = 0.0254;

/** Spacing of the slope samples used for the code checks (about 5 ft). */
export const ANALYSIS_STEP_METERS = 1.5;
/**
 * Slope at each sample is the rise over this much travel. Barometric
 * height is steady over about 10 m (33 ft); GPS altitude needs far longer.
 * Pitches shorter than the window are averaged down, so the 1:10 and 1:8
 * limits on 10 ft runs need the slope level to confirm.
 */
export const ANALYSIS_WINDOW_METERS: Record<ElevationSource, number> = {
  barometer: 10,
  gps: 50,
};

const TRAIL_SEGMENT_LIMITS = [
  { label: '1:20 (5%)', maxLengthFeet: 200, minSlope: 0.05 },
  { label: '1:12 (8.33%)', maxLengthFeet: 30, minSlope: 1 / 12 },
  { label: '1:10 (10%)', maxLengthFeet: 10, minSlope: 0.1 },
];
const TRAIL_MAX_SLOPE = 0.12;
const TRAIL_MAX_STEEP_SHARE = 0.3;
const WALKING_SURFACE_MAX_SLOPE = 0.05;
const RAMP_MAX_SLOPE = 1 / 12;
const RAMP_MAX_RISE_METERS = 30 * METERS_PER_INCH;
const ROUTE_MAX_CROSS_SLOPE = 1 / 48;
const TRAIL_MAX_CROSS_SLOPE: Record<TrailSurface, number> = {
  natural: 0.05,
  paved: 1 / 48,
};
const EPSILON = 1e-9;
/** A window with a hole in the data longer than this has no slope. */
const MAX_GAP_METERS = 15;
/** Points needed in a window before slope uses a least-squares fit. */
const MIN_FIT_POINTS = 4;
/**
 * Slope noise allowance (1 point of grade) for "review this area" cautions:
 * a stretch that would break a length limit if brief dips this far below
 * the threshold were ignored. Violations always use the exact threshold.
 */
const RUN_HYSTERESIS = 0.01;
/** Share of the trail that must have a measured slope to call it complete. */
export const COMPLETE_COVERAGE = 0.95;

type SeriesPoint = { distance: number; elevation: number };
type SlopeSample = {
  endMeters: number;
  slope: number | null;
  startMeters: number;
};
type SteepRun = {
  endMeters: number;
  lengthMeters: number;
  maxSlope: number;
  riseMeters: number;
  startMeters: number;
};

export function formatFeet(meters: number) {
  return `${Math.round(meters / METERS_PER_FOOT).toLocaleString()} ft`;
}

export function formatSlope(slope: number) {
  const degrees = (Math.atan(Math.abs(slope)) * 180) / Math.PI;
  return `${(Math.abs(slope) * 100).toFixed(1)}% (${degrees.toFixed(1)}°)`;
}

export function formatStation(finding: AccessibilityFinding) {
  const start = Math.round(finding.startMeters / METERS_PER_FOOT);
  const end = Math.round(finding.endMeters / METERS_PER_FOOT);
  return start === end ? `at ${start} ft` : `${start}–${end} ft`;
}

/**
 * One elevation per step of travel along the time-smoothed track, so GPS
 * zig-zag does not stretch the distance and understate slope.
 */
export function elevationSeries(
  points: TrailPoint[],
  source: ElevationSource,
): SeriesPoint[] {
  return withElevation(smoothedTrack(points, source));
}

/** Moves level readings from live recorder distance onto the smoothed track. */
function placeReadings(track: TrackSample[], levelReadings: LevelReading[]) {
  return levelReadings.map(reading => ({
    ...reading,
    distanceMeters: toTrackDistance(track, reading.distanceMeters),
  }));
}

/** Index of the last series point at or before the distance. */
function segmentIndex(series: SeriesPoint[], distance: number) {
  let low = 0;
  let high = series.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (series[middle].distance <= distance) low = middle;
    else high = middle;
  }
  return low;
}

function interpolate(series: SeriesPoint[], distance: number) {
  const index = segmentIndex(series, distance);
  const a = series[index];
  const b = series[Math.min(index + 1, series.length - 1)];
  if (b.distance === a.distance) return a.elevation;
  const t = (distance - a.distance) / (b.distance - a.distance);
  return a.elevation + (b.elevation - a.elevation) * t;
}

/**
 * Slope samples every ANALYSIS_STEP_METERS. Each is the rise over a window
 * centred on the sample (shifted inward at the ends), read from the
 * elevation profile by linear interpolation. Windows spanning a gap in the
 * data longer than MAX_GAP_METERS have no slope.
 */
export function slopeSamples(
  series: SeriesPoint[],
  windowMeters: number,
  stepMeters = ANALYSIS_STEP_METERS,
): SlopeSample[] {
  const first = series[0];
  const last = series.at(-1);
  if (!first || !last || last.distance - first.distance < windowMeters)
    return [];

  const samples: SlopeSample[] = [];
  for (
    let start = first.distance;
    start < last.distance - EPSILON;
    start += stepMeters
  ) {
    const end = Math.min(start + stepMeters, last.distance);
    const center = (start + end) / 2;
    const from = Math.min(
      Math.max(center - windowMeters / 2, first.distance),
      last.distance - windowMeters,
    );
    const to = from + windowMeters;

    let hasGap = false;
    const fromIndex = segmentIndex(series, from);
    for (let index = fromIndex; index < series.length - 1; index += 1) {
      if (series[index].distance > to) break;
      if (series[index + 1].distance - series[index].distance > MAX_GAP_METERS)
        hasGap = true;
    }

    // A least-squares fit through the window's points averages out sensor
    // noise; sparse windows fall back to the interpolated end-to-end rise.
    const windowPoints: SeriesPoint[] = [];
    for (let index = fromIndex; index < series.length; index += 1) {
      if (series[index].distance > to) break;
      if (series[index].distance >= from) windowPoints.push(series[index]);
    }
    const slope = hasGap
      ? null
      : windowPoints.length >= MIN_FIT_POINTS
        ? leastSquaresSlope(windowPoints)
        : (interpolate(series, to) - interpolate(series, from)) / windowMeters;
    samples.push({ endMeters: end, slope, startMeters: start });
  }
  return samples;
}

/**
 * Contiguous same-direction stretches steeper than the threshold. With a
 * hysteresis, brief dips less than that below the threshold do not end a
 * run once it has started, so noise cannot split one long steep segment
 * into short ones that each look compliant.
 */
export function steepRuns(
  samples: SlopeSample[],
  threshold: number,
  hysteresis = 0,
) {
  const runs: SteepRun[] = [];
  let current: (SteepRun & { direction: number }) | null = null;
  // Dip samples are only added to the run if it turns steep again.
  let pendingLength = 0;
  let pendingRise = 0;

  samples.forEach(({ endMeters, slope, startMeters }) => {
    const length = endMeters - startMeters;
    const magnitude = slope === null ? 0 : Math.abs(slope);
    const direction = slope === null ? 0 : Math.sign(slope);
    const continues =
      current !== null &&
      slope !== null &&
      direction === current.direction &&
      magnitude > threshold - hysteresis;

    if (magnitude > threshold + EPSILON && slope !== null) {
      if (continues && current) {
        current.endMeters = endMeters;
        current.lengthMeters += pendingLength + length;
        current.riseMeters += pendingRise + slope * length;
        current.maxSlope = Math.max(current.maxSlope, magnitude);
      } else {
        current = {
          direction,
          endMeters,
          lengthMeters: length,
          maxSlope: magnitude,
          riseMeters: slope * length,
          startMeters,
        };
        runs.push(current);
      }
      pendingLength = 0;
      pendingRise = 0;
    } else if (continues && slope !== null) {
      pendingLength += length;
      pendingRise += slope * length;
    } else {
      current = null;
      pendingLength = 0;
      pendingRise = 0;
    }
  });
  return runs;
}

function overlaps(finding: AccessibilityFinding, run: SteepRun) {
  return (
    finding.startMeters < run.endMeters && finding.endMeters > run.startMeters
  );
}

function runSummary(run: SteepRun) {
  return `${formatFeet(run.lengthMeters)} long, averaging ${formatSlope(run.riseMeters / run.lengthMeters)}, peak ${formatSlope(run.maxSlope)}`;
}

function trailFindings(
  samples: SlopeSample[],
  analyzedMeters: number,
  totalMeters: number,
): AccessibilityFinding[] {
  const findings: AccessibilityFinding[] = [];
  const cautions: AccessibilityFinding[] = [];

  TRAIL_SEGMENT_LIMITS.forEach(({ label, maxLengthFeet, minSlope }) => {
    const maxLengthMeters = maxLengthFeet * METERS_PER_FOOT + EPSILON;
    const bandViolations: AccessibilityFinding[] = [];
    steepRuns(samples, minSlope).forEach(run => {
      if (run.lengthMeters <= maxLengthMeters) return;
      bandViolations.push({
        citation: 'ABA 1017.7.1',
        endMeters: run.endMeters,
        limit: `${maxLengthFeet} ft max`,
        measured: runSummary(run),
        rule: `Segment steeper than ${label} is too long`,
        severity: 'violation',
        startMeters: run.startMeters,
      });
    });
    findings.push(...bandViolations);

    // Stretches that only break the limit if near-threshold dips are noise.
    steepRuns(samples, minSlope, RUN_HYSTERESIS).forEach(run => {
      if (run.lengthMeters <= maxLengthMeters) return;
      if (bandViolations.some(finding => overlaps(finding, run))) return;
      cautions.push({
        citation: 'ABA 1017.7.1',
        endMeters: run.endMeters,
        limit: `${maxLengthFeet} ft max steeper than ${label}`,
        measured: `${runSummary(run)}, dipping just under ${label}`,
        rule: 'Review this area: slope hovers at the limit',
        severity: 'caution',
        startMeters: run.startMeters,
      });
    });
  });

  steepRuns(samples, TRAIL_MAX_SLOPE).forEach(run => {
    findings.push({
      citation: 'ABA 1017.7.1',
      endMeters: run.endMeters,
      limit: '1:8 (12%) max anywhere',
      measured: formatSlope(run.maxSlope),
      rule: 'Running slope steeper than 1:8',
      severity: 'violation',
      startMeters: run.startMeters,
    });
  });

  // 30% rule. Measured steep length is a lower bound, so it is a violation
  // over the whole trail even when coverage is partial. Otherwise it is only
  // judged on a (nearly) complete measurement.
  const steepMeters = steepRuns(samples, 1 / 12).reduce(
    (sum, run) => sum + run.lengthMeters,
    0,
  );
  const coverage = totalMeters > 0 ? analyzedMeters / totalMeters : 0;
  const complete = coverage >= COMPLETE_COVERAGE;
  const share =
    complete && analyzedMeters > 0
      ? steepMeters / analyzedMeters
      : steepMeters / Math.max(totalMeters, EPSILON);
  if (analyzedMeters > 0 && share > TRAIL_MAX_STEEP_SHARE) {
    findings.push({
      citation: 'ABA 1017.7.1',
      endMeters: totalMeters,
      limit: '30% of trail length max',
      measured: `${(share * 100).toFixed(0)}% of length`,
      rule: 'Too much of the trail is steeper than 1:12',
      severity: 'violation',
      startMeters: 0,
      wholeTrail: true,
    });
  } else if (
    analyzedMeters > 0 &&
    !complete &&
    (steepMeters + totalMeters - analyzedMeters) / totalMeters >
      TRAIL_MAX_STEEP_SHARE
  ) {
    cautions.push({
      citation: 'ABA 1017.7.1',
      endMeters: totalMeters,
      limit: '30% of trail length max',
      measured: `${(coverage * 100).toFixed(0)}% of the trail measured, ${((steepMeters / totalMeters) * 100).toFixed(0)}% of length steeper than 1:12 so far`,
      rule: 'Not checked: too little of the trail has slope data',
      severity: 'caution',
      startMeters: 0,
      wholeTrail: true,
    });
  }

  // Steep segments within their length limit still need resting intervals.
  steepRuns(samples, 0.05).forEach(run => {
    if ([...findings, ...cautions].some(finding => overlaps(finding, run)))
      return;
    cautions.push({
      citation: 'ABA 1017.7.1, 1017.8',
      endMeters: run.endMeters,
      limit: 'Resting interval at each end',
      measured: runSummary(run),
      rule: 'Steep segment within its length limit',
      severity: 'caution',
      startMeters: run.startMeters,
    });
  });

  return [...findings, ...cautions];
}

function routeFindings(samples: SlopeSample[]): AccessibilityFinding[] {
  const findings: AccessibilityFinding[] = [];

  const runs = steepRuns(samples, WALKING_SURFACE_MAX_SLOPE);
  runs.forEach(run => {
    const tooSteep = steepRuns(
      samples.filter(
        sample =>
          sample.startMeters >= run.startMeters - EPSILON &&
          sample.endMeters <= run.endMeters + EPSILON,
      ),
      RAMP_MAX_SLOPE,
    );
    tooSteep.forEach(steep => {
      findings.push({
        citation: 'CBC 11B-405.2',
        endMeters: steep.endMeters,
        limit: '1:12 (8.33%) max',
        measured: `${formatSlope(steep.maxSlope)} over ${formatFeet(steep.lengthMeters)}`,
        rule: 'Ramp steeper than 1:12',
        severity: 'violation',
        startMeters: steep.startMeters,
      });
    });

    const riseInches = Math.abs(run.riseMeters) / METERS_PER_INCH;
    const tooMuchRise =
      Math.abs(run.riseMeters) > RAMP_MAX_RISE_METERS + EPSILON;
    if (tooMuchRise) {
      findings.push({
        citation: 'CBC 11B-405.6',
        endMeters: run.endMeters,
        limit: '30 in rise per run, then a landing',
        measured: `${riseInches.toFixed(0)} in over ${formatFeet(run.lengthMeters)}`,
        rule: 'Ramp rises too far without a landing',
        severity: 'violation',
        startMeters: run.startMeters,
      });
    }

    if (tooSteep.length === 0 && !tooMuchRise) {
      findings.push({
        citation: 'CBC 11B-403.3, 11B-405',
        endMeters: run.endMeters,
        limit: 'Needs ramp handrails, landings, edge protection',
        measured: `up to ${formatSlope(run.maxSlope)} over ${formatFeet(run.lengthMeters)}`,
        rule: 'Steeper than 1:20, so it must be built as a ramp',
        severity: 'caution',
        startMeters: run.startMeters,
      });
    }
  });

  // Rise that only breaks 11B-405.6 if near-threshold dips are noise.
  steepRuns(samples, WALKING_SURFACE_MAX_SLOPE, RUN_HYSTERESIS).forEach(run => {
    if (Math.abs(run.riseMeters) <= RAMP_MAX_RISE_METERS + EPSILON) return;
    const coveredBy = (finding: AccessibilityFinding) =>
      finding.citation === 'CBC 11B-405.6' && overlaps(finding, run);
    if (findings.some(coveredBy)) return;
    findings.push({
      citation: 'CBC 11B-405.6',
      endMeters: run.endMeters,
      limit: '30 in rise per run, then a landing',
      measured: `${(Math.abs(run.riseMeters) / METERS_PER_INCH).toFixed(0)} in over ${formatFeet(run.lengthMeters)}, dipping just under 1:20`,
      rule: 'Review this area: slope hovers at the limit',
      severity: 'caution',
      startMeters: run.startMeters,
    });
  });

  return findings;
}

function levelFindings(
  readings: LevelReading[],
  standard: AccessibilityStandard,
  surface: TrailSurface,
): AccessibilityFinding[] {
  const maxCross =
    standard === 'trail'
      ? TRAIL_MAX_CROSS_SLOPE[surface]
      : ROUTE_MAX_CROSS_SLOPE;
  const maxRunning = standard === 'trail' ? TRAIL_MAX_SLOPE : RAMP_MAX_SLOPE;
  const findings: AccessibilityFinding[] = [];

  readings.forEach(reading => {
    const cross = reading.crossSlopePercent / 100;
    const running = reading.runningSlopePercent / 100;
    if (cross > maxCross + EPSILON) {
      findings.push({
        citation:
          standard === 'trail' ? 'ABA 1017.7.2' : 'CBC 11B-403.3, 11B-405.3',
        endMeters: reading.distanceMeters,
        limit: maxCross === 0.05 ? '1:20 (5%) max' : '1:48 (2.08%) max',
        measured: `${formatSlope(cross)} across (level reading)`,
        rule: 'Cross slope too steep',
        severity: 'violation',
        startMeters: reading.distanceMeters,
      });
    }
    if (running > maxRunning + EPSILON) {
      findings.push({
        citation: standard === 'trail' ? 'ABA 1017.7.1' : 'CBC 11B-405.2',
        endMeters: reading.distanceMeters,
        limit: standard === 'trail' ? '1:8 (12%) max' : '1:12 (8.33%) max',
        measured: `${formatSlope(running)} (level reading)`,
        rule: 'Running slope too steep at this spot',
        severity: 'violation',
        startMeters: reading.distanceMeters,
      });
    }
  });

  return findings;
}

export function analyzeTrailAccessibility(
  points: TrailPoint[],
  levelReadings: LevelReading[],
  standard: AccessibilityStandard,
  surface: TrailSurface,
): AccessibilityReport {
  const source = chooseElevationSource(points);
  const windowMeters = ANALYSIS_WINDOW_METERS[source];
  const track = smoothedTrack(points, source);
  const totalDistanceMeters = track.at(-1)?.distance ?? 0;
  const samples = slopeSamples(withElevation(track), windowMeters);
  const measured = samples.filter(sample => sample.slope !== null);
  const analyzedDistanceMeters = measured.reduce(
    (sum, sample) => sum + sample.endMeters - sample.startMeters,
    0,
  );
  const steepThreshold =
    standard === 'trail' ? 1 / 12 : WALKING_SURFACE_MAX_SLOPE;
  const steepMeters = steepRuns(samples, steepThreshold).reduce(
    (sum, run) => sum + run.lengthMeters,
    0,
  );

  const findings = [
    ...(standard === 'trail'
      ? trailFindings(samples, analyzedDistanceMeters, totalDistanceMeters)
      : routeFindings(samples)),
    ...levelFindings(placeReadings(track, levelReadings), standard, surface),
  ].sort((first, second) =>
    first.severity === second.severity
      ? first.startMeters - second.startMeters
      : first.severity === 'violation'
        ? -1
        : 1,
  );

  return {
    analyzedDistanceMeters,
    coverage:
      totalDistanceMeters > 0
        ? Math.min(analyzedDistanceMeters / totalDistanceMeters, 1)
        : 0,
    findings,
    maxSlopePercent:
      measured.length > 0
        ? Math.max(...measured.map(sample => Math.abs(sample.slope ?? 0))) * 100
        : null,
    source,
    steepShare:
      analyzedDistanceMeters > 0 ? steepMeters / analyzedDistanceMeters : 0,
    totalDistanceMeters,
    windowMeters,
  };
}

/**
 * CSV with distance and elevation in feet, readable by the web slope
 * checker. Barometric elevations are heights relative to the start.
 */
export function trailToCsv(
  points: TrailPoint[],
  levelReadings: LevelReading[],
) {
  const source = chooseElevationSource(points);
  const rows = ['distance_ft,elevation_ft,cross_slope_pct'];
  const track = smoothedTrack(points, source);
  const readings = placeReadings(track, levelReadings);
  withElevation(track).forEach(({ distance, elevation }) => {
    const nearby = readings.filter(
      reading => Math.abs(reading.distanceMeters - distance) <= 2,
    );
    const cross =
      nearby.length > 0
        ? Math.max(...nearby.map(reading => reading.crossSlopePercent)).toFixed(
            1,
          )
        : '';
    rows.push(
      [
        (distance / METERS_PER_FOOT).toFixed(2),
        (elevation / METERS_PER_FOOT).toFixed(2),
        cross,
      ].join(','),
    );
  });
  return rows.join('\n');
}
