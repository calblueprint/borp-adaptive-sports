import { StyleSheet } from 'react-native';
import { colors, shadow } from '@/styles/theme';

export const MARKER = 44;
export const RIM = 3;
export const BADGE = 18;

export default StyleSheet.create({
  // Shadow on the outer view, since the face clips its photo
  marker: {
    position: 'absolute',
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: colors.white,
    ...shadow.raised,
  },
  face: {
    position: 'absolute',
    left: RIM,
    top: RIM,
    right: RIM,
    bottom: RIM,
    borderRadius: MARKER / 2,
    overflow: 'hidden',
    backgroundColor: colors.fill,
  },
  pressed: { transform: [{ scale: 0.92 }] },
  photo: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: BADGE + 4,
    height: BADGE + 4,
    borderRadius: (BADGE + 4) / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
