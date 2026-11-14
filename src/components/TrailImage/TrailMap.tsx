// Placeholder topo map generated from a trail's seed. The list thumbnail and the detail hero draw the
// same map at different crops, so a trail looks the same in both places. Swap for a real map later.
import type { Trail } from '@/data/trails';
import { memo, useMemo } from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, trailColors } from '@/styles/theme';

type Point = [number, number];

// SVG text doesn't inherit the app font; on web it would fall back to a serif.
const FONT = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif',
  default: undefined,
});

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom spline through the points, as cubic Béziers. */
function smooth(pts: Point[], closed: boolean) {
  const n = pts.length;
  const at = (i: number) =>
    closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

function blob(
  cx: number,
  cy: number,
  r: number,
  s: number,
  amp: number,
): Point[] {
  return Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const rr =
      r * (1 + amp * Math.sin(a * 3 + s) + amp * 0.6 * Math.sin(a * 5 + s * 2));
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.8];
  });
}

function routePoints(seed: number): Point[] {
  const r = rng(seed * 7919 + 13);
  let x = 110 + r() * 60;
  const drift = (r() - 0.3) * 40;
  return Array.from({ length: 9 }, (_, i) => {
    if (i) x = Math.max(70, Math.min(330, x + drift + (r() - 0.5) * 130));
    return [
      x,
      660 - (360 * i) / 8 + (i && i < 8 ? (r() - 0.5) * 36 : 0),
    ] as Point;
  });
}

function buildMap(t: Trail) {
  const r = rng(t.seed * 31 + 5);
  const A: Point = [270 + r() * 110, 300 + r() * 80];
  const B: Point = [-20 + r() * 80, 610 + r() * 70];
  const contours: { d: string; index: boolean }[] = [];
  const labels: { x: number; y: number; text: string }[] = [];
  // Contour interval shrinks for low-lying trails so labels never go below sea level.
  const interval = Math.min(20, Math.max(2, Math.floor(t.elevFt / 12)));
  for (let i = 1; i <= 15; i++) {
    const pts = blob(A[0], A[1], i * 26, t.seed + i * 0.15, 0.09);
    contours.push({ d: smooth(pts, true), index: i % 5 === 0 });
    const elev = t.elevFt - (i - 5) * interval;
    if (i % 5 === 0 && elev >= 0)
      labels.push({ x: pts[0][0] + 4, y: pts[0][1] - 5, text: `${elev} ft` });
  }
  for (let i = 1; i <= 9; i++) {
    contours.push({
      d: smooth(blob(B[0], B[1], i * 30, t.seed * 2 + i * 0.2, 0.1), true),
      index: i % 5 === 0,
    });
  }
  const woods = [0, 1, 2].map(i =>
    smooth(
      blob(40 + r() * 320, 260 + r() * 440, 50 + r() * 60, t.seed + i, 0.22),
      true,
    ),
  );
  const route = routePoints(t.seed);
  const start = route[0];
  const lakeAt: Point = [start[0] > 200 ? 90 : 300, 560];
  const lake = t.water
    ? smooth(blob(lakeAt[0], lakeAt[1], 52, t.seed, 0.14), true)
    : undefined;
  return {
    contours,
    labels,
    woods,
    lake,
    lakeAt,
    route: smooth(route, false),
    start,
    end: route[route.length - 1],
  };
}

/** Text with a land-coloured halo so it stays readable over contour lines. */
function MapLabel({
  x,
  y,
  text,
  size = 18,
  color = colors.stone,
  bold = false,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  bold?: boolean;
}) {
  const common = {
    x,
    y,
    fontSize: size,
    fontFamily: FONT,
    fontWeight: bold ? '600' : '400',
  } as const;
  return (
    <G>
      <SvgText
        {...common}
        stroke={trailColors.mapLand}
        strokeWidth={6}
        strokeLinejoin="round"
        fill={trailColors.mapLand}
      >
        {text}
      </SvgText>
      <SvgText {...common} fill={color}>
        {text}
      </SvgText>
    </G>
  );
}

type Variant = 'hero' | 'banner' | 'thumb';
type Props = { trail: Trail; variant: Variant };

// Thumbnails crop tight on the route; the banner shows the whole route with land either side.
const VIEW: Record<Exclude<Variant, 'hero'>, string> = {
  thumb: '-20 262 440 440',
  banner: '-470 256 1340 424',
};

export const TrailMap = memo(function TrailMap({ trail, variant }: Props) {
  const m = useMemo(() => buildMap(trail), [trail]);
  const hero = variant === 'hero';
  const k = hero ? 1.15 : variant === 'banner' ? 2.4 : 3.2; // the hero is drawn ~2×, thumbnails ~5× smaller than the map, so lines are thickened to match
  const thin = variant === 'banner'; // the banner is drawn smaller per unit than a thumb, but shouldn't look bolder
  const [sx, sy] = m.start;
  const [ex, ey] = m.end;

  // Hero: the viewBox keeps the route clear of the back button and of the sheet overlapping the map's
  // bottom; "meet" guarantees that on any screen width (the land and contours extend past the viewBox).
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={hero ? '-185 111 760 642' : VIEW[variant]}
      preserveAspectRatio={hero ? 'xMidYMid meet' : 'xMidYMid slice'}
    >
      <Rect
        x={-1000}
        y={-200}
        width={3000}
        height={1200}
        fill={trailColors.mapLand}
      />
      {m.woods.map((d, i) => (
        <Path key={`w${i}`} d={d} fill={trailColors.mapWood} />
      ))}
      {m.lake ? <Path d={m.lake} fill={trailColors.mapWater} /> : null}
      {m.contours.map((c, i) => (
        <Path
          key={`c${i}`}
          d={c.d}
          fill="none"
          stroke={c.index ? trailColors.mapIndex : trailColors.mapLine}
          strokeWidth={(c.index ? 2.2 : 1.2) * k}
        />
      ))}
      {hero &&
        m.labels.map(l => (
          <MapLabel
            key={l.text}
            x={l.x}
            y={l.y}
            text={l.text}
            size={19}
            color={trailColors.mapLabel}
          />
        ))}
      {hero && m.lake && trail.water ? (
        <SvgText
          x={m.lakeAt[0]}
          y={m.lakeAt[1] + 6}
          fontSize={21}
          fontFamily={FONT}
          fontStyle="italic"
          textAnchor="middle"
          fill={trailColors.mapWaterLabel}
        >
          {trail.water}
        </SvgText>
      ) : null}

      <Path
        d={m.route}
        fill="none"
        stroke={colors.white}
        strokeWidth={hero ? 18 : thin ? 22 : 30}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={m.route}
        fill="none"
        stroke={colors.ink}
        strokeWidth={hero ? 8 : thin ? 10 : 15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {hero ? (
        <G>
          <G transform={`translate(${sx - 56} ${sy + 6})`}>
            <Rect width={34} height={34} rx={8} fill={colors.ink} />
            <SvgText
              x={17}
              y={25}
              fontSize={22}
              fontFamily={FONT}
              fontWeight="700"
              textAnchor="middle"
              fill={colors.white}
            >
              P
            </SvgText>
          </G>
          <Circle
            cx={sx}
            cy={sy}
            r={11}
            fill={colors.white}
            stroke={colors.ink}
            strokeWidth={6}
          />
          <MapLabel x={sx + 20} y={sy + 7} text="Trailhead" size={22} bold />
          <Circle
            cx={ex}
            cy={ey}
            r={10}
            fill={colors.ink}
            stroke={colors.white}
            strokeWidth={5}
          />
          <MapLabel
            x={ex + 19}
            y={ey + 7}
            text={`End · ${trail.miles} mi`}
            size={22}
            bold
          />
        </G>
      ) : (
        <Circle
          cx={sx}
          cy={sy}
          r={thin ? 12 : 16}
          fill={colors.white}
          stroke={colors.ink}
          strokeWidth={thin ? 7 : 9}
        />
      )}
    </Svg>
  );
});
