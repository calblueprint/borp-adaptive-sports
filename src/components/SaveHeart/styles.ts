import { Platform, StyleSheet } from 'react-native';
import { colors, overlay } from '@/styles/theme';

export const PHOTO_HIT = 40;

export default StyleSheet.create({
  pressed: { opacity: 0.6 },
  photoHit: {
    position: 'absolute',
    width: PHOTO_HIT,
    height: PHOTO_HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPressed: { transform: [{ scale: 0.9 }] },
  // A drop shadow keeps the outline visible on bright photos. iOS shades the heart's own shape (the view has
  // no background); elsewhere the box would cast a square shadow, so Android and web use a filter instead.
  photoHeart: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.45,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    default: {
      filter: [
        {
          dropShadow: {
            offsetX: 0,
            offsetY: 1,
            standardDeviation: 3,
            color: overlay.glyphShadow,
          },
        },
      ],
    },
  }),
  glassHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
