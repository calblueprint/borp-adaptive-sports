// Grade along the trail: one bar per stretch, so you can see *where* it gets steep, not just how steep.
// Bars over the 5% guideline are solid black; the rest a light grey. Drag across to read any stretch: the
// stretch under your finger stays solid and the rest step back.
// Prototype: the survey data only has the steepest grade, so the profile is generated from the trail's
// seed and scaled so its peak matches that reading.
import type { Trail } from '@/data/trails';
import type { LayoutChangeEvent } from 'react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '@/styles/theme';
import styles, { HEIGHT } from './styles';

const BARS = 44;
const GAP = 2;
const GUIDELINE = 5; // % — steeper is allowed only for short runs
const LIGHT = colors.chartBar;

function rng(seed: number) {
  let a = seed * 2654435761;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mostly gentle, with one or two short climbs that peak at the surveyed steepest grade. */
function profile(seed: number, steepest: number) {
  const r = rng(seed);
  // Gently rolling baseline, kept well under both the guideline and the peak
  const base = Math.min(steepest * 0.55, 3.5);
  const [a, p] = [1.5 + r() * 2, r() * Math.PI];
  const rolling = Array.from(
    { length: BARS },
    (_, i) =>
      base *
      (0.45 +
        0.35 * Math.abs(Math.sin((i / BARS) * Math.PI * a + p)) +
        r() * 0.2),
  );
  // Short climbs: a few bars wide, so they read as pitches, not the whole trail
  const climbs = Array.from(
    { length: steepest > GUIDELINE ? 1 + Math.floor(r() * 2) : 1 },
    () => ({
      at: 4 + Math.floor(r() * (BARS - 8)),
      width: 1.2 + r() * 1.6,
    }),
  );
  const grades = rolling.map((g, i) => {
    const bump = Math.max(
      ...climbs.map(c => Math.exp(-(((i - c.at) / c.width) ** 2))),
    );
    return g + (steepest - g) * bump;
  });
  // Exactly one stretch hits the surveyed peak
  const top = grades.indexOf(Math.max(...grades));
  grades[top] = steepest;
  return grades.map(g => Math.max(0.4, Math.min(g, steepest)));
}

/** "7.2%" → 7.2 */
const pct = (value: string) => parseFloat(value);

/** The generated grade profile for a trail (prototype), one value per stretch. */
export function gradeProfile(trail: Trail, steepest: string) {
  return profile(trail.seed, pct(steepest));
}

/** Where along the trail (0–1) the steepest stretch is, so the map's pin and the chart agree. */
export function steepestAt(trail: Trail, steepest: string) {
  const g = gradeProfile(trail, steepest);
  return (g.indexOf(Math.max(...g)) + 0.5) / BARS;
}

export function GradeChart({
  trail,
  steepest,
}: {
  trail: Trail;
  steepest: string;
}) {
  const peak = pct(steepest);
  const grades = useMemo(() => profile(trail.seed, peak), [trail.seed, peak]);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const yMax = Math.max(peak, GUIDELINE + 1) * 1.12;
  const barW = width ? (width - GAP * (BARS - 1)) / BARS : 0;
  const y = (v: number) => HEIGHT - (v / yMax) * HEIGHT;
  const mileAt = (i: number) => ((i + 0.5) / BARS) * trail.miles;
  const fmtMi = (mi: number) =>
    `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;

  const peakAt = grades.indexOf(Math.max(...grades));
  const over = grades.reduce(
    (n, g, i) => n + (g > GUIDELINE && !(grades[i - 1] > GUIDELINE) ? 1 : 0),
    0,
  );
  const summary =
    `Grade along the trail. Steepest ${peak} percent around ${fmtMi(mileAt(peakAt))}. ` +
    (over
      ? `${over} ${over === 1 ? 'stretch' : 'stretches'} over ${GUIDELINE} percent.`
      : `Stays under ${GUIDELINE} percent.`);

  // The length is on the axis, so at rest the readout only adds the climb
  const readout =
    active === null
      ? `${trail.gainFt} ft gain`
      : `${grades[active].toFixed(1)}% at ${fmtMi(mileAt(active))}`;
  const pick = (x: number) => {
    if (width)
      setActive(
        Math.max(0, Math.min(BARS - 1, Math.floor((x / width) * BARS))),
      );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.caption} accessibilityRole="header">
          Grade
        </Text>
        <Text style={[styles.readout, active !== null && styles.readoutActive]}>
          {readout}
        </Text>
      </View>

      <View
        accessible
        accessibilityLabel={summary}
        onLayout={(e: LayoutChangeEvent) =>
          setWidth(e.nativeEvent.layout.width)
        }
        // Drag to read a stretch; a vertical swipe still scrolls the page
        onStartShouldSetResponder={() => true}
        onResponderGrant={e => pick(e.nativeEvent.locationX)}
        onResponderMove={e => pick(e.nativeEvent.locationX)}
        onResponderRelease={() => setActive(null)}
        onResponderTerminate={() => setActive(null)}
        onResponderTerminationRequest={() => true}
        style={styles.plot}
      >
        {width ? (
          <Svg width={width} height={HEIGHT + 1}>
            {grades.map((g, i) => {
              const x = i * (barW + GAP);
              const top = y(g);
              const r = Math.min(2, barW / 2, HEIGHT - top);
              // Rounded at the top only; flat on the baseline
              const d = `M${x} ${HEIGHT}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + barW - r}Q${x + barW} ${top} ${x + barW} ${top + r}V${HEIGHT}Z`;
              const fill = active === i || g > GUIDELINE ? colors.ink : LIGHT;
              return (
                <Path
                  key={i}
                  d={d}
                  fill={fill}
                  opacity={active === null || active === i ? 1 : 0.4}
                />
              );
            })}
            <Line
              x1={0}
              x2={width}
              y1={y(GUIDELINE)}
              y2={y(GUIDELINE)}
              stroke={colors.tertiary}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Line
              x1={0}
              x2={width}
              y1={HEIGHT + 0.5}
              y2={HEIGHT + 0.5}
              stroke={colors.hairline}
              strokeWidth={1}
            />
          </Svg>
        ) : null}
        {/* The guideline's value sits at its right end, above the dashes */}
        {width ? (
          <Text style={[styles.guide, { top: y(GUIDELINE) - 17 }]}>
            {GUIDELINE}%
          </Text>
        ) : null}
      </View>

      <View style={styles.axis}>
        <Text style={styles.tick}>Start</Text>
        <Text style={styles.tick}>{fmtMi(trail.miles)}</Text>
      </View>
    </View>
  );
}
