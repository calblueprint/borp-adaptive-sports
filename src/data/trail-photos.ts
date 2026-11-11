// Each trail's photos. Placeholders (16:10, 354×221pt @3x) stand in for the prototype's Wikimedia Commons
// photos. Real photos need crediting wherever they're shown, e.g. on the trail page, so each keeps a credit.
import type { ImageSourcePropType } from 'react-native';
import { PLACEHOLDER, PLACEHOLDER_CREDIT } from './placeholders';

export type PhotoCredit = { author: string; license: string; source: string };

export const TRAIL_PHOTOS: Record<
  string,
  { image: ImageSourcePropType; credit: PhotoCredit }
> = {
  'coyote-hills': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'crissy-field': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'jewel-lake': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'lake-chabot': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'lands-end': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'muir-woods': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'nimitz-way': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'point-pinole': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'quarry-lakes': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
  'verna-dunshee': {
    image: PLACEHOLDER.photo,
    credit: PLACEHOLDER_CREDIT,
  },
};

/**
 * More photos of each trail (4:3, 900×675), shown in the trail page's photo
 * strip after the main photo. Trails without extras show no strip. Credits shown in the photo viewer.
 */
export const TRAIL_GALLERY: Record<
  string,
  { image: ImageSourcePropType; credit: PhotoCredit }[]
> = {
  'jewel-lake': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
  'crissy-field': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
  'lands-end': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
  'lake-chabot': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
  'muir-woods': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
  'coyote-hills': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
  'quarry-lakes': [
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
    { image: PLACEHOLDER.photoWide, credit: PLACEHOLDER_CREDIT },
  ],
};

/** The main photo first, then the extras. */
export function trailPhotos(trailId: string) {
  return [TRAIL_PHOTOS[trailId], ...(TRAIL_GALLERY[trailId] ?? [])].filter(
    Boolean,
  );
}
