// What volunteers photographed at their pins on the demo surveys (src/data/submissions.ts). Placeholders
// stand in for the prototype's Wikimedia Commons photos of trail problems, keeping each one's shape.
import type { ImageSourcePropType } from 'react-native';
import type { PhotoCredit } from './trail-photos';
import { PLACEHOLDER, PLACEHOLDER_CREDIT } from './placeholders';

export const PIN_PHOTOS = {
  narrowMakiki: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
  narrowChampoeg: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
  roots: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
  uphill: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
  steepTrack: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
  hillside: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
  looseGravel: {
    image: PLACEHOLDER.photoPortrait,
    credit: PLACEHOLDER_CREDIT,
  },
  gate: {
    image: PLACEHOLDER.photoWide,
    credit: PLACEHOLDER_CREDIT,
  },
} satisfies Record<string, { image: ImageSourcePropType; credit: PhotoCredit }>;
