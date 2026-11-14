import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export const PAD = 3;

export default StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: 12,
    backgroundColor: colors.fill,
  },
  // Segment x is measured from the track's outer edge, so the thumb is placed from there too
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: 0,
    borderRadius: 9,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segment: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: { fontSize: 13, fontWeight: '500', color: colors.secondary },
  labelOn: { color: colors.ink, fontWeight: '600' },
});
