// The Borp logo split into layers that can move independently. Each layer is a full-size SVG in the
// same 1024×1024 space, so stacking them reproduces the static logo exactly.
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LOGO_PATHS, SPEED_LINES } from './paths';

type LayerProps = { size: number; color: string; viewBox?: string };

const FULL_VIEWBOX = '0 0 1024 1024';

/** The person: body, head and the wheel hub. */
export const RIDER_PATHS = [LOGO_PATHS.body, LOGO_PATHS.head, LOGO_PATHS.hub];
/** The wheel plus the tail of the trail — one connected shape in the artwork. */
export const WHEEL_TRAIL_PATHS = [LOGO_PATHS.wheel, LOGO_PATHS.tail];
/** Everything except the speed lines and wordmark. */
export const MARK_PATHS = [...WHEEL_TRAIL_PATHS, ...RIDER_PATHS];

function Layer({
  size,
  viewBox = FULL_VIEWBOX,
  children,
}: {
  size: number;
  viewBox?: string;
  children: ReactNode;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </Svg>
  );
}

/** Any set of logo paths as one layer. */
export function PathsLayer({
  size,
  color,
  viewBox,
  paths,
}: LayerProps & { paths: readonly string[] }) {
  return (
    <Layer size={size} viewBox={viewBox}>
      {paths.map((d, i) => (
        <Path key={i} d={d} fill={color} />
      ))}
    </Layer>
  );
}

/** One speed line (index 0–2, top to bottom). */
export function SpeedLineLayer({
  size,
  color,
  viewBox,
  index,
}: LayerProps & { index: number }) {
  return (
    <PathsLayer
      size={size}
      color={color}
      viewBox={viewBox}
      paths={[SPEED_LINES[index].d]}
    />
  );
}
