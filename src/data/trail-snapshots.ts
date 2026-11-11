// Each trail's route map. Placeholders stand in for the prototype's Apple Maps snapshots.
import type { ImageSourcePropType } from 'react-native';
import { PLACEHOLDER } from './placeholders';

export type SnapshotVariant = 'thumb' | 'banner' | 'card';

export const TRAIL_SNAPSHOTS: Record<
  string,
  Record<SnapshotVariant, ImageSourcePropType>
> = {
  'coyote-hills': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'crissy-field': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'jewel-lake': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'lake-chabot': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'lands-end': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'muir-woods': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'nimitz-way': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'point-pinole': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'quarry-lakes': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
  'verna-dunshee': {
    thumb: PLACEHOLDER.mapThumb,
    banner: PLACEHOLDER.mapBanner,
    card: PLACEHOLDER.mapCard,
  },
};
