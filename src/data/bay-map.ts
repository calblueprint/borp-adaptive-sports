// The profile's map: a placeholder standing in for an Apple Maps snapshot of the Bay Area, 440×260pt, and every trail's
// trailhead on it as 0–1 fractions of the image. The app places the markers itself so they can be tapped.
import type { ImageSourcePropType } from 'react-native';
import { PLACEHOLDER } from './placeholders';

export const BAY_MAP: ImageSourcePropType = PLACEHOLDER.mapBay;
export const BAY_SIZE = { width: 440, height: 260 };

export const BAY_TRAILHEADS: Record<string, [number, number]> = {
  'coyote-hills': [0.6237, 0.8502],
  'crissy-field': [0.3934, 0.5203],
  'jewel-lake': [0.5142, 0.3808],
  'lake-chabot': [0.6134, 0.6341],
  'lands-end': [0.3645, 0.5521],
  'muir-woods': [0.3208, 0.3936],
  'nimitz-way': [0.5278, 0.3883],
  'point-pinole': [0.4589, 0.2709],
  'quarry-lakes': [0.6749, 0.8169],
  'verna-dunshee': [0.3231, 0.359],
};
