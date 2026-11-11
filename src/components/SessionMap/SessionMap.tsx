// The survey session map: an Apple Maps snapshot of this trail with the route drawn faintly. While
// recording, "you" walk the real route from the trailhead at a fake, demo-friendly pace, tracing the
// walked part in solid black. Pins sit where they were dropped. The map pans to keep you (or the pin being
// edited) just above the sheet. Trails without a snapshot fall back to the placeholder topo image.
import type { IconName } from '@/components/Icon/Icon';
import type { Mark } from '@/data/trails';
import { useEffect, useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { Icon } from '@/components/Icon/Icon';
import { PLACEHOLDER } from '@/data/placeholders';
import { SESSION_SIZE, TRAIL_SESSION_MAPS } from '@/data/trail-session-maps';
import { colors, spring } from '@/styles/theme';
import {
  BOX_W,
  BUBBLE_H,
  bubbleShape,
  DOT_X,
  DOT_Y,
  REST_DY,
  SHAPE,
} from './geometry';
import styles from './styles';

export { bubbleShape } from './geometry';

const FALLBACK = PLACEHOLDER.trailMap; // 864 × 1024
const FALLBACK_SIZE = { width: 864, height: 1024 };
/** Trail A traced off the placeholder map, as fractions of the image, starting at the "P" trailhead. */
const FALLBACK_ROUTE: [number, number][] = (
  [
    [203, 968],
    [210, 955],
    [257.5, 917.5],
    [285, 887.5],
    [300, 880],
    [315, 895],
    [352.5, 905],
    [370, 885],
    [385, 862.5],
    [395, 857.5],
    [420, 870],
    [445, 877.5],
    [462.5, 865],
    [472.5, 872.5],
    [482.5, 890],
    [510, 890],
    [545, 882.5],
    [577.5, 891],
  ] as [number, number][]
).map(([x, y]) => [x / FALLBACK_SIZE.width, y / FALLBACK_SIZE.height]);

/** The map image, its aspect and the walkable route for a trail. */
export function sessionMap(trailId: string) {
  const m = TRAIL_SESSION_MAPS[trailId];
  return m
    ? {
        image: m.image,
        aspect: SESSION_SIZE.height / SESSION_SIZE.width,
        route: m.route,
      }
    : {
        image: FALLBACK,
        aspect: FALLBACK_SIZE.height / FALLBACK_SIZE.width,
        route: FALLBACK_ROUTE,
      };
}

/** Prototype pace: the whole route takes 6 minutes of recording, so the walk is visible in a demo. */
const WALK_MS = 6 * 60_000;

export type MapPoint = { x: number; y: number };

/** Where you are after `elapsed` ms of recording: map fractions, 0–1 progress, and the walked trace. */
export function walkPosition(
  elapsed: number,
  route: [number, number][] = FALLBACK_ROUTE,
  aspect = 1,
): MapPoint & { progress: number; trace: [number, number][] } {
  // Measure in screen proportions so tall and wide maps walk at an even pace
  const seg = route
    .slice(1)
    .map(([x, y], i) =>
      Math.hypot(x - route[i][0], (y - route[i][1]) * aspect),
    );
  const total = seg.reduce((a, b) => a + b, 0);
  const progress = Math.min(1, elapsed / WALK_MS);
  let left = progress * total;
  const trace: [number, number][] = [route[0]];
  for (let i = 0; i < seg.length; i++) {
    const [ax, ay] = route[i];
    const [bx, by] = route[i + 1];
    if (left <= seg[i]) {
      const t = seg[i] ? left / seg[i] : 0;
      const p: [number, number] = [ax + (bx - ax) * t, ay + (by - ay) * t];
      trace.push(p);
      return { x: p[0], y: p[1], progress, trace };
    }
    left -= seg[i];
    trace.push(route[i + 1]);
  }
  const [x, y] = route[route.length - 1];
  return { x, y, progress, trace };
}

/** A point `f` (0–1) of the way along a route, measured in screen proportions. */
export function routePoint(
  f: number,
  route: [number, number][],
  aspect: number,
): MapPoint {
  const { x, y } = walkPosition(f * WALK_MS, route, aspect);
  return { x, y };
}

/** `last` = a spot the last survey flagged, still to re-check: grey, so it never reads as one of your pins. */
export type MapPin = MapPoint & {
  id: string;
  n: number;
  icon?: IconName;
  mark?: Mark;
  needsDetails?: boolean;
  last?: boolean;
  label?: string;
};

/** Solid grey for last-survey spots (secondary text over white), so it stays opaque on the map. */

type Props = {
  trailId: string;
  /** Height of the bottom sheet, so the focus point sits just above it. */
  bottom: number;
  you: MapPoint;
  trace: [number, number][];
  pins: MapPin[];
  /** The pin open in the sheet; it's drawn selected and the map centres on it instead of you. */
  activeId?: string;
  onPinPress: (id: string) => void;
};

export function SessionMap({
  trailId,
  bottom,
  you,
  trace,
  pins,
  activeId,
  onPinPress,
}: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const map = sessionMap(trailId);
  const w = Math.max(W * 1.6, SESSION_SIZE.width);
  const h = w * map.aspect;

  const focus = pins.find(p => p.id === activeId) ?? you;
  const fx = focus.x * w;
  const fy = focus.y * h;
  // Focus point a little left of centre and just above the sheet, never showing past the map's edges
  const left = clamp(W * 0.45 - fx, W - w, 0);
  const top = clamp(H - bottom - 64 - fy, H - bottom + 24 - h, 0);

  const tx = useSharedValue(left);
  const ty = useSharedValue(top);
  useEffect(() => {
    const ease = { duration: 900, easing: Easing.out(Easing.cubic) };
    tx.set(withTiming(left, ease));
    ty.set(withTiming(top, ease));
  }, [left, top, tx, ty]);
  const pan = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }],
  }));

  const points = useMemo(
    () => trace.map(([x, y]) => `${x * w},${y * h}`).join(' '),
    [trace, w, h],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          { position: 'absolute', left: 0, top: 0, width: w, height: h },
          pan,
        ]}
      >
        <Image
          source={map.image}
          style={{ width: w, height: h }}
          accessibilityIgnoresInvertColors
        />
        {/* The walked part, solid over the faint route */}
        <Svg
          width={w}
          height={h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Polyline
            points={points}
            stroke={colors.white}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Polyline
            points={points}
            stroke={colors.ink}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
        <YouAreHere x={you.x * w} y={you.y * h} />
        {pins.map(p => (
          <PinMarker
            key={p.id}
            pin={p}
            x={p.x * w}
            y={p.y * h}
            active={p.id === activeId}
            onPress={() => onPinPress(p.id)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/* ---------- Overview ---------- */

/**
 * The whole survey at a glance, for the wrap-up: the map framed on the route and the pins, the walked
 * part in black. Still (no "you are here"); pins drop in as it appears and open on tap.
 */
/** Without `onPinPress` it's a picture: pins aren't buttons, and VoiceOver reads the list beside it instead. */
export function RouteOverview({
  trailId,
  trace,
  pins,
  width,
  height,
  onPinPress,
}: {
  trailId: string;
  trace: [number, number][];
  pins: MapPin[];
  width: number;
  height: number;
  onPinPress?: (id: string) => void;
}) {
  const map = sessionMap(trailId);
  // Frame the route and every pin, in units of the image's width, with room for the pin heads
  const xs = [...map.route.map(p => p[0]), ...pins.map(p => p.x)];
  const ys = [...map.route.map(p => p[1]), ...pins.map(p => p.y)].map(
    y => y * map.aspect,
  );
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const pad = 0.06;
  // Image width in points: fit the frame, but never smaller than the box (no edges showing)
  const w = Math.max(
    Math.min(width / (x1 - x0 + 2 * pad), height / (y1 - y0 + 3 * pad)),
    width,
    height / map.aspect,
  );
  const h = w * map.aspect;
  const left = clamp(width / 2 - (w * (x0 + x1)) / 2, width - w, 0);
  // A little low, so pin heads above the route aren't cut off
  const top = clamp(
    height / 2 - (w * (y0 + y1)) / 2 + (w * pad) / 2,
    height - h,
    0,
  );
  const points = trace.map(([x, y]) => `${x * w},${y * h}`).join(' ');

  return (
    <View
      style={[styles.overview, { width, height }]}
      pointerEvents={onPinPress ? 'auto' : 'none'}
      importantForAccessibility={onPinPress ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!onPinPress}
    >
      <View style={{ position: 'absolute', left, top, width: w, height: h }}>
        <Image
          source={map.image}
          style={{ width: w, height: h }}
          accessibilityIgnoresInvertColors
        />
        <Svg
          width={w}
          height={h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Polyline
            points={points}
            stroke={colors.white}
            strokeWidth={7.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Polyline
            points={points}
            stroke={colors.ink}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
        {pins.map(p => (
          <PinMarker
            key={p.id}
            pin={p}
            x={p.x * w}
            y={p.y * h}
            active={false}
            onPress={() => onPinPress?.(p.id)}
          />
        ))}
      </View>
    </View>
  );
}

/* ---------- You are here ---------- */

function YouAreHere({ x, y }: { x: number; y: number }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  const px = useSharedValue(x);
  const py = useSharedValue(y);
  useEffect(() => {
    if (!reduceMotion)
      t.set(
        withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
          -1,
          false,
        ),
      );
  }, [t, reduceMotion]);
  // Glide between the once-a-second position updates
  useEffect(() => {
    px.set(withTiming(x, { duration: 1000, easing: Easing.linear }));
    py.set(withTiming(y, { duration: 1000, easing: Easing.linear }));
  }, [x, y, px, py]);
  const move = useAnimatedStyle(() => ({
    transform: [{ translateX: px.get() - 22 }, { translateY: py.get() - 22 }],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: 0.3 * (1 - t.get()),
    transform: [{ scale: 1 + t.get() * 2.2 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.here, move]}
      accessible
      accessibilityLabel="You are here"
    >
      <Animated.View style={[styles.hereRing, ring]} />
      <View style={styles.hereDot} />
    </Animated.View>
  );
}

/* ---------- Pins ---------- */

/**
 * Map marker. The glyph says what was pinned; a black "!" badge when it fails the guideline, a dashed rim
 * and mic while it still needs details. At rest a circle on the spot; selected, it lifts into the pin
 * (triangle and dot underneath) and bounces once. Arrives by dropping onto its spot.
 */
export function PinMarker({
  pin,
  x,
  y,
  active,
  onPress,
}: {
  pin: MapPin;
  x: number;
  y: number;
  active: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const drop = useSharedValue(reduceMotion ? 0 : -72);
  const fade = useSharedValue(0);
  const squash = useSharedValue(1);
  const lift = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    fade.set(withTiming(1, { duration: 140 }));
    if (reduceMotion) return;
    drop.set(withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }));
    squash.set(
      withDelay(
        270,
        withSequence(
          withTiming(0.78, { duration: 80 }),
          withSpring(1, spring.pop),
        ),
      ),
    );
  }, [drop, fade, squash, reduceMotion]);
  useEffect(() => {
    lift.set(
      reduceMotion ? (active ? 1 : 0) : withSpring(active ? 1 : 0, spring.pop),
    );
  }, [active, lift, reduceMotion]);

  // Lands on the spot: squashes from the circle's bottom edge and springs back
  const body = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [
      { translateY: drop.get() },
      { scaleY: squash.get() },
      { scaleX: 2 - squash.get() },
    ],
  }));
  // Rest → selected: the head rises off the spot
  const bubble = useAnimatedStyle(() => ({
    transform: [{ translateY: REST_DY * (1 - lift.get()) }],
  }));
  const selected = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, lift.get())),
  }));

  const last = pin.last;
  const hollow = !last && pin.needsDetails;
  const warn = !hollow && !last && pin.mark === 'warn';
  const glyph: IconName = hollow ? 'mic' : (pin.icon ?? 'pin');
  const label =
    pin.label ??
    `Pin ${pin.n}${hollow ? ', needs details' : warn ? ', fails the guideline' : pin.mark === 'ok' ? ', meets the guideline' : ''}`;
  const ink = last ? colors.lastSurvey : colors.ink;

  return (
    <View
      style={[
        styles.pinWrap,
        { left: x - DOT_X, top: y - DOT_Y, zIndex: active ? 2 : 1 },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.pinBody, body]} pointerEvents="box-none">
        {/* The exact spot, uncovered once the head lifts off it */}
        <Animated.View
          style={[styles.dot, last && { backgroundColor: ink }, selected]}
        />
        <Animated.View style={[styles.bubble, bubble]} pointerEvents="box-none">
          <Animated.View
            style={[StyleSheet.absoluteFill, selected]}
            pointerEvents="none"
          >
            <Svg width={BOX_W} height={BUBBLE_H}>
              <Path
                d={SHAPE.tail}
                fill={ink}
                stroke={ink}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
          <Pressable
            onPress={onPress}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            style={styles.headHit}
          >
            {/* Last survey's spot: filled grey with a white glyph, the inverse of your white pins */}
            <View
              style={[
                styles.head,
                hollow && styles.headHollow,
                last && styles.headLast,
              ]}
            >
              <Icon
                name={glyph}
                size={22}
                color={last ? colors.white : colors.ink}
                strokeWidth={2}
                optical
              />
            </View>
            {warn ? (
              <View style={styles.badge}>
                <Svg width={10} height={14} viewBox="0 0 8 12">
                  <Path
                    d="M4 1.5v5.5"
                    stroke={colors.white}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                  <Circle cx={4} cy={10} r={1.4} fill={colors.white} />
                </Svg>
              </View>
            ) : null}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** The pin as a small, still speech bubble (head and triangle), for lists that mirror the map. */
export function PinBubble({
  icon,
  hollow,
  size = 32,
}: {
  icon: IconName;
  hollow?: boolean;
  size?: number;
}) {
  const s = useMemo(() => bubbleShape(size / 2, 1.5), [size]);
  return (
    <View style={{ width: s.width, height: s.height }}>
      <Svg width={s.width} height={s.height}>
        <Path
          d={s.tail}
          fill={colors.ink}
          stroke={colors.ink}
          strokeWidth={1}
          strokeLinejoin="round"
        />
        <Path
          d={s.head}
          fill={colors.white}
          stroke={colors.ink}
          strokeWidth={1.5}
          strokeDasharray={hollow ? '3 2.5' : undefined}
        />
      </Svg>
      <View
        style={[
          styles.miniGlyph,
          { top: s.cy - size / 2, width: s.width, height: size },
        ]}
      >
        <Icon
          name={icon}
          size={Math.round(size * 0.52)}
          color={colors.ink}
          strokeWidth={1.9}
          optical
        />
      </View>
    </View>
  );
}
