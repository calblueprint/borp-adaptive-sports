// The trail page's map section: the real Apple Maps snapshot framed on the route, the route in black from
// the trailhead (white dot), and a pin wherever the last survey flagged something. The list under it
// mirrors the pins (DESIGN: lists mirror the map): tap either one and both light up. Directions sit right
// under it, so "where is it" and "how do I get there" are one place.
import type { Trail } from '@/data/trails';
import type { LayoutChangeEvent } from 'react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  PinBubble,
  PinMarker,
  routePoint,
  sessionMap,
} from '@/components/SessionMap/SessionMap';
import { type ProblemSpot } from '@/lib/access';
import { colors } from '@/styles/theme';
import styles, { BUBBLE } from './styles';

// Frame height / width: wide by default, taller for routes that run north–south so they still fit
const ASPECT = { min: 0.72, max: 1.2 };
const PAD = 0.16; // room around the route, as a share of the frame

export function RouteMap({
  trail,
  spots,
}: {
  trail: Trail;
  spots: ProblemSpot[];
}) {
  const [W, setW] = useState(0);
  // The first spot starts lifted, so the map opens showing a full pin and the row it mirrors
  const [active, setActive] = useState<string | null>(spots[0]?.key ?? null);
  const map = sessionMap(trail.id);
  const bounds = useMemo(() => {
    const xs = map.route.map(p => p[0]);
    const ys = map.route.map(p => p[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [map]);
  const routeAspect =
    ((bounds.maxY - bounds.minY) * map.aspect) /
    Math.max(bounds.maxX - bounds.minX, 0.01);
  const H = W * Math.min(ASPECT.max, Math.max(ASPECT.min, routeAspect));

  // Frame the route: scale the snapshot so the route fills the frame with some room, never showing its edges
  const frame = useMemo(() => {
    if (!W) return null;
    const { minX, maxX, minY, maxY } = bounds;
    const fit = Math.min(
      (W * (1 - 2 * PAD)) / Math.max(maxX - minX, 0.01),
      (H * (1 - 2 * PAD)) / Math.max((maxY - minY) * map.aspect, 0.01),
    );
    const w = Math.min(Math.max(fit, W, H / map.aspect), W * 5);
    const h = w * map.aspect;
    const left = clamp(W / 2 - ((minX + maxX) / 2) * w, W - w, 0);
    const top = clamp(H / 2 - ((minY + maxY) / 2) * h, H - h, 0);
    return { w, h, left, top };
  }, [W, H, map, bounds]);

  const pins = useMemo(
    () =>
      spots.map((s, i) => ({
        ...s,
        n: i + 1,
        ...routePoint(s.at, map.route, map.aspect),
      })),
    [spots, map],
  );
  const select = (key: string) => {
    Haptics.selectionAsync();
    setActive(a => (a === key ? null : key));
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.frame, { height: H || undefined }]}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        accessible={!spots.length}
        accessibilityLabel={`Map of ${trail.name}${spots.length ? `, ${spots.length} ${spots.length === 1 ? 'spot' : 'spots'} flagged on the last survey` : ''}`}
      >
        {frame ? (
          <Pressable
            onPress={() => setActive(null)}
            style={{
              position: 'absolute',
              left: frame.left,
              top: frame.top,
              width: frame.w,
              height: frame.h,
            }}
            importantForAccessibility="no"
          >
            <Image
              source={map.image}
              style={{ width: frame.w, height: frame.h }}
              accessibilityIgnoresInvertColors
            />
            <Svg
              width={frame.w}
              height={frame.h}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Polyline
                points={map.route
                  .map(([x, y]) => `${x * frame.w},${y * frame.h}`)
                  .join(' ')}
                stroke={colors.white}
                strokeWidth={7.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Polyline
                points={map.route
                  .map(([x, y]) => `${x * frame.w},${y * frame.h}`)
                  .join(' ')}
                stroke={colors.ink}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* The trailhead: where the route starts and where Directions go */}
              <Circle
                cx={map.route[0][0] * frame.w}
                cy={map.route[0][1] * frame.h}
                r={6.5}
                fill={colors.white}
                stroke={colors.ink}
                strokeWidth={3}
              />
            </Svg>
            {pins.map(p => (
              <PinMarker
                key={p.key}
                pin={{ id: p.key, n: p.n, x: p.x, y: p.y, icon: p.icon }}
                x={p.x * frame.w}
                y={p.y * frame.h}
                active={active === p.key}
                onPress={() => select(p.key)}
              />
            ))}
          </Pressable>
        ) : null}
      </View>

      {spots.length ? (
        <View>
          {spots.map((s, i) => {
            const on = active === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => select(s.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${s.title}, ${s.detail}, at mile ${s.mile}`}
                accessibilityHint="Shows it on the map"
                style={({ pressed }) => [
                  styles.row,
                  (pressed || on) && styles.rowOn,
                ]}
              >
                {/* Inset from the text, like iOS lists: the bubbles read as one column */}
                {i > 0 ? <View style={styles.divider} /> : null}
                {/* Same as its pin on the map */}
                <PinBubble icon={s.icon} size={BUBBLE} />
                <View style={styles.flex}>
                  <Text style={styles.title} numberOfLines={1}>
                    {s.title}
                  </Text>
                  {s.detail ? (
                    <Text style={styles.detail} numberOfLines={1}>
                      {s.detail}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.mile}>{s.mile} mi</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
