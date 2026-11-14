import Svg, { Path } from 'react-native-svg';
import { colors } from '@/styles/theme';
import { LOGO_PATHS, SPEED_LINES } from './paths';

type Props = {
  /** Rendered width in points. Height follows the viewBox. */
  width: number;
  color?: string;
  /** "full" = rider + wordmark (square), "wordmark" = BORP letters only. */
  variant?: 'full' | 'wordmark';
};

// The wordmark crop matches the Figma header logo (86.47 × 21 frame cropping the 1024² image).
const VIEWBOX = {
  full: { x: 0, y: 0, w: 1024, h: 1024 },
  wordmark: { x: 89.8, y: 682.6, w: 838.6, h: 203.7 },
};

export function BorpLogo({
  width,
  color = colors.navy,
  variant = 'full',
}: Props) {
  const vb = VIEWBOX[variant];
  const parts =
    variant === 'full'
      ? [...Object.values(LOGO_PATHS), ...SPEED_LINES.map(l => l.d)]
      : [LOGO_PATHS.letterB, LOGO_PATHS.letterOR, LOGO_PATHS.letterP];
  return (
    <Svg
      width={width}
      height={(width * vb.h) / vb.w}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      accessibilityLabel="Borp"
    >
      {parts.map((d, i) => (
        <Path key={i} d={d} fill={color} />
      ))}
    </Svg>
  );
}
