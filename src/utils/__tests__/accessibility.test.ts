import { piecewiseGrade, walk } from '@/test-utils/trailFixtures';
import {
  analyzeTrailAccessibility,
  COMPLETE_COVERAGE,
  steepRuns,
} from '@/utils/accessibility';

const FOOT = 0.3048;

function barometerWalk(pieces: { grade: number; length: number }[]) {
  const lengthMeters = pieces.reduce((sum, piece) => sum + piece.length, 0);
  return walk({ lengthMeters, relativeAltitude: piecewiseGrade(pieces) });
}

describe('steepRuns', () => {
  // Slope alternating just above and just below 5%.
  const samples = Array.from({ length: 200 }, (_, index) => ({
    endMeters: (index + 1) * 1.5,
    slope: index % 2 === 0 ? 0.051 : 0.041,
    startMeters: index * 1.5,
  }));

  it('splits at every dip below the exact threshold', () => {
    const runs = steepRuns(samples, 0.05);
    expect(runs).toHaveLength(100);
    expect(Math.max(...runs.map(run => run.lengthMeters))).toBeCloseTo(1.5);
  });

  it('joins near-threshold dips only when given a hysteresis', () => {
    const runs = steepRuns(samples, 0.05, 0.01);
    expect(runs).toHaveLength(1);
    // The final dip is not part of the run.
    expect(runs[0].lengthMeters).toBeCloseTo(298.5);
  });
});

describe('analyzeTrailAccessibility', () => {
  it('passes a flat trail with full coverage', () => {
    const report = analyzeTrailAccessibility(
      barometerWalk([{ grade: 0, length: 300 }]),
      [],
      'trail',
      'natural',
    );
    expect(report.source).toBe('barometer');
    expect(report.findings).toEqual([]);
    expect(report.coverage).toBeGreaterThanOrEqual(COMPLETE_COVERAGE);
  });

  it('flags a stretch steeper than 1:8', () => {
    const report = analyzeTrailAccessibility(
      barometerWalk([
        { grade: 0, length: 100 },
        { grade: 0.16, length: 30 },
        { grade: 0, length: 100 },
      ]),
      [],
      'trail',
      'natural',
    );
    const steep = report.findings.find(
      finding => finding.rule === 'Running slope steeper than 1:8',
    );
    expect(steep?.severity).toBe('violation');
    expect(steep?.startMeters).toBeGreaterThan(80);
    expect(steep?.endMeters).toBeLessThan(150);
  });

  it('flags a 1:20 segment longer than 200 ft', () => {
    const report = analyzeTrailAccessibility(
      barometerWalk([
        { grade: 0, length: 50 },
        { grade: 0.065, length: 120 },
        { grade: 0, length: 50 },
      ]),
      [],
      'trail',
      'natural',
    );
    const violation = report.findings.find(finding =>
      finding.rule.startsWith('Segment steeper than 1:20'),
    );
    expect(violation?.severity).toBe('violation');
  });

  it('does not turn a near-threshold wobble into a violation', () => {
    // 50 m pieces just over 1:20, each under the 200 ft limit, separated by
    // dips just under it. Together they would be far over the limit.
    const pieces = Array.from({ length: 5 }, () => [
      { grade: 0.054, length: 45 },
      { grade: 0.046, length: 12 },
    ]).flat();
    const report = analyzeTrailAccessibility(
      barometerWalk([{ grade: 0, length: 30 }, ...pieces]),
      [],
      'trail',
      'natural',
    );
    const violations = report.findings.filter(f => f.severity === 'violation');
    expect(violations).toEqual([]);
    const review = report.findings.find(finding =>
      finding.rule.startsWith('Review this area'),
    );
    expect(review?.severity).toBe('caution');
    expect(review!.endMeters - review!.startMeters).toBeGreaterThan(200 * FOOT);
  });

  it('reports partial coverage when elevation is missing part-way', () => {
    // GPS only, with no altitude over the middle 200 m.
    const points = walk({
      altitude: distance =>
        distance > 150 && distance < 350 ? null : 100 + distance * 0.01,
      lengthMeters: 500,
    });
    const report = analyzeTrailAccessibility(points, [], 'trail', 'natural');
    expect(report.source).toBe('gps');
    expect(report.totalDistanceMeters).toBeGreaterThan(480);
    expect(report.coverage).toBeLessThan(COMPLETE_COVERAGE);
    expect(report.analyzedDistanceMeters).toBeLessThan(
      report.totalDistanceMeters * 0.7,
    );
  });

  it('marks the 30% rule as not checked when too little was measured', () => {
    // Steep (1:11) for the measured stretch, then no altitude at all.
    const points = walk({
      altitude: distance => (distance <= 120 ? distance * 0.09 : null),
      lengthMeters: 400,
    });
    const report = analyzeTrailAccessibility(points, [], 'trail', 'natural');
    expect(
      report.findings.some(
        f => f.rule === 'Too much of the trail is steeper than 1:12',
      ),
    ).toBe(false);
    const notChecked = report.findings.find(finding =>
      finding.rule.startsWith('Not checked'),
    );
    expect(notChecked?.wholeTrail).toBe(true);
  });

  it('applies the 30% rule on a complete measurement', () => {
    const report = analyzeTrailAccessibility(
      barometerWalk([
        { grade: 0, length: 50 },
        // Each steep piece is under 30 ft so only the share rule applies.
        ...Array.from({ length: 12 }, () => [
          { grade: 0.09, length: 8 },
          { grade: 0, length: 8 },
        ]).flat(),
      ]),
      [],
      'trail',
      'natural',
    );
    // Window averaging may or may not keep the pieces steep, but the rule
    // must never be skipped as "not checked" when coverage is complete.
    expect(report.coverage).toBeGreaterThanOrEqual(COMPLETE_COVERAGE);
    expect(report.findings.some(f => f.rule.startsWith('Not checked'))).toBe(
      false,
    );
  });

  it('reports level reading violations without slope data', () => {
    const points = walk({ lengthMeters: 4 });
    const report = analyzeTrailAccessibility(
      points,
      [
        {
          capturedAt: points[0].capturedAt,
          crossSlopePercent: 8,
          distanceMeters: 0,
          runningSlopePercent: 2,
        },
      ],
      'trail',
      'natural',
    );
    expect(report.analyzedDistanceMeters).toBe(0);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]).toMatchObject({
      citation: 'ABA 1017.7.2',
      severity: 'violation',
    });
  });
});
