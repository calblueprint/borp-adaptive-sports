// Trail map pictures.
// - Snapshot: real Apple Maps (muted style) with the trail's OpenStreetMap route drawn on, rendered
//   offline by scripts/trail-maps and bundled, so they show with no signal. See src/data/trail-snapshots.ts.
// - Trails added in the app have no snapshot yet, so they fall back to the generated topo (TrailMap).
import type { SnapshotVariant } from '@/data/trail-snapshots';
import type { Trail } from '@/data/trails';
import { Image } from 'react-native';
import { TrailMap } from '@/components/TrailImage/TrailMap';
import { PLACEHOLDER } from '@/data/placeholders';
import { TRAIL_SNAPSHOTS } from '@/data/trail-snapshots';
import styles from './styles';

const MAP = PLACEHOLDER.trailMap; // 864 × 1024

/** Full-bleed map for the top of the trail details screen. */
export function TrailHero({ height }: { height: number }) {
  return (
    <Image
      source={MAP}
      style={{ width: '100%', height }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Fills its parent: a square thumbnail, a wide banner, or a 16:10 card. */
export function TrailSnapshot({
  trail,
  variant,
}: {
  trail: Trail;
  variant: SnapshotVariant;
}) {
  const snapshot = TRAIL_SNAPSHOTS[trail.id]?.[variant];
  if (!snapshot)
    return (
      <TrailMap
        trail={trail}
        variant={variant === 'thumb' ? 'thumb' : 'banner'}
      />
    );
  return (
    <Image
      source={snapshot}
      style={styles.fill}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}
