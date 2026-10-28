import {
  chooseElevationSource,
  distanceBetweenPoints,
  elevationFrom,
  ElevationSource,
  hasUsableAltitude,
  isUsableForDistance,
  MIN_TRAVEL_STEP_METERS,
  TrailPoint,
} from '@/utils/trail';

/*
 * Settings below come from simulating a 1.5 km walk at walking (1.3 m/s) and
 * wheelchair (0.9 m/s) pace, with GPS error of about 4 m that wanders over
 * roughly 30 s and barometer noise of about 0.1 m:
 * - iOS ignores timeInterval and delivers about one fix per second with
 *   distanceInterval 1 m, and the barometer runs at a fixed ~1 Hz. Coarser
 *   distance intervals (2–20 m) did not make the profile more accurate.
 * - Raw fixes zig-zag around the true path, which overstated distance by
 *   6–9% and so understated slope by the same amount. Averaging positions
 *   over 10 s brought distance within about 2%.
 * - Smoothing barometric elevation over 5 m and counting a climb only once it
 *   exceeds 0.5 m kept elevation gain within about 5% of the truth.
 */
export const POSITION_SMOOTHING_SECONDS = 10;
export const PROFILE_STEP_METERS = 1;
export const ELEVATION_SMOOTHING_METERS: Record<ElevationSource, number> = {
  barometer: 5,
  gps: 30,
};
export const GAIN_THRESHOLD_METERS: Record<ElevationSource, number> = {
  barometer: 0.5,
  gps: 3,
};
/** Fixes with both readings needed to place barometric height above sea level. */
const MIN_OFFSET_FIXES = 5;

export type TrackSample = {
  /** Distance along the time-smoothed track. */
  distance: number;
  /** Null where the chosen source has no reading at this fix. */
  elevation: number | null;
  /** The recorder's live cumulative distance at this fix. */
  recordedDistance: number;
};

export type ProfileSample = { distance: number; elevation: number };

/** The track samples that have an elevation. */
export function withElevation(track: TrackSample[]): ProfileSample[] {
  return track.flatMap(({ distance, elevation }) =>
    elevation === null ? [] : [{ distance, elevation }],
  );
}

export type ElevationProfile = {
  /** True when elevations are above sea level, false when relative to start. */
  absolute: boolean;
  gainMeters: number;
  maxElevation: number;
  minElevation: number;
  /** Smoothed elevation every PROFILE_STEP_METERS. */
  samples: ProfileSample[];
  source: ElevationSource;
  totalDistanceMeters: number;
};

/**
 * One sample per step of travel along the track after averaging positions
 * over POSITION_SMOOTHING_SECONDS, so GPS zig-zag does not add distance.
 * Fixes without elevation still count towards distance.
 */
export function smoothedTrack(
  points: TrailPoint[],
  source: ElevationSource,
): TrackSample[] {
  const usable = points.filter(isUsableForDistance);
  const times = usable.map(point => Date.parse(point.capturedAt));
  const halfWindowMs = (POSITION_SMOOTHING_SECONDS * 1000) / 2;

  const samples: TrackSample[] = [];
  let windowStart = 0;
  let windowEnd = 0;
  let distance = 0;
  let anchor: { latitude: number; longitude: number } | null = null;

  usable.forEach((point, index) => {
    while (times[index] - times[windowStart] > halfWindowMs) windowStart += 1;
    while (
      windowEnd + 1 < usable.length &&
      times[windowEnd + 1] - times[index] <= halfWindowMs
    )
      windowEnd += 1;

    let latitude = 0;
    let longitude = 0;
    for (let k = windowStart; k <= windowEnd; k += 1) {
      latitude += usable[k].latitude;
      longitude += usable[k].longitude;
    }
    const count = windowEnd - windowStart + 1;
    const position = {
      latitude: latitude / count,
      longitude: longitude / count,
    };

    let advanced = anchor === null;
    if (anchor) {
      const movement = distanceBetweenPoints(anchor, position);
      if (movement >= MIN_TRAVEL_STEP_METERS) {
        distance += movement;
        advanced = true;
      }
    }
    if (!advanced) return;
    anchor = position;

    samples.push({
      distance,
      elevation: elevationFrom(point, source),
      recordedDistance: point.cumulativeDistanceMeters,
    });
  });

  return samples;
}

/** Converts a distance from the live recorder onto the smoothed track. */
export function toTrackDistance(
  track: TrackSample[],
  recordedDistance: number,
) {
  const first = track[0];
  if (!first) return recordedDistance;
  let previous = first;
  for (const sample of track) {
    if (sample.recordedDistance >= recordedDistance) {
      const span = sample.recordedDistance - previous.recordedDistance;
      if (span <= 0) return sample.distance;
      const t = (recordedDistance - previous.recordedDistance) / span;
      return previous.distance + (sample.distance - previous.distance) * t;
    }
    previous = sample;
  }
  return previous.distance;
}

/**
 * Median difference between GPS altitude and barometric height, used to
 * place the steadier barometric profile at a real elevation.
 */
function barometerOffset(points: TrailPoint[]) {
  const offsets = points
    .filter(
      point => point.relativeAltitude !== null && hasUsableAltitude(point),
    )
    .map(point => (point.altitude ?? 0) - (point.relativeAltitude ?? 0))
    .sort((a, b) => a - b);
  if (offsets.length < MIN_OFFSET_FIXES) return null;
  return offsets[Math.floor(offsets.length / 2)];
}

/** Linear interpolation of elevation every stepMeters along the track. */
export function resampleTrack(track: ProfileSample[], stepMeters: number) {
  const first = track[0];
  const last = track.at(-1);
  if (!first || !last) return [];

  const samples: ProfileSample[] = [];
  let index = 0;
  for (
    let distance = first.distance;
    distance <= last.distance + 1e-9;
    distance += stepMeters
  ) {
    while (index < track.length - 2 && track[index + 1].distance < distance)
      index += 1;
    const a = track[index];
    const b = track[Math.min(index + 1, track.length - 1)];
    const span = b.distance - a.distance;
    const t =
      span > 0 ? Math.min(Math.max((distance - a.distance) / span, 0), 1) : 0;
    samples.push({
      distance,
      elevation: a.elevation + (b.elevation - a.elevation) * t,
    });
  }
  return samples;
}

/** Centred moving average over windowMeters of evenly spaced samples. */
export function smoothElevations(
  samples: ProfileSample[],
  windowMeters: number,
  stepMeters: number,
) {
  const half = Math.max(0, Math.round(windowMeters / 2 / stepMeters));
  const prefix = [0];
  samples.forEach(sample =>
    prefix.push((prefix.at(-1) ?? 0) + sample.elevation),
  );
  return samples.map((sample, index) => {
    const from = Math.max(0, index - half);
    const to = Math.min(samples.length - 1, index + half);
    return {
      distance: sample.distance,
      elevation: (prefix[to + 1] - prefix[from]) / (to - from + 1),
    };
  });
}

/**
 * Total climb, counting a rise only once it exceeds the threshold above the
 * lowest point since the last counted climb, so noise is not added up.
 */
export function elevationGain(
  samples: ProfileSample[],
  thresholdMeters: number,
) {
  const first = samples[0];
  if (!first) return 0;
  let gain = 0;
  let reference = first.elevation;
  samples.forEach(({ elevation }) => {
    if (elevation > reference + thresholdMeters) {
      gain += elevation - reference;
      reference = elevation;
    } else if (elevation < reference) {
      reference = elevation;
    }
  });
  return gain;
}

export function buildElevationProfile(
  points: TrailPoint[],
): ElevationProfile | null {
  const source = chooseElevationSource(points);
  const track = withElevation(smoothedTrack(points, source));
  if (track.length < 2) return null;

  const offset = source === 'barometer' ? barometerOffset(points) : 0;
  const smoothed = smoothElevations(
    resampleTrack(track, PROFILE_STEP_METERS),
    ELEVATION_SMOOTHING_METERS[source],
    PROFILE_STEP_METERS,
  ).map(sample => ({
    distance: sample.distance,
    elevation: sample.elevation + (offset ?? 0),
  }));
  const elevations = smoothed.map(sample => sample.elevation);

  return {
    absolute: offset !== null,
    gainMeters: elevationGain(smoothed, GAIN_THRESHOLD_METERS[source]),
    maxElevation: Math.max(...elevations),
    minElevation: Math.min(...elevations),
    samples: smoothed,
    source,
    totalDistanceMeters: smoothed.at(-1)?.distance ?? 0,
  };
}
