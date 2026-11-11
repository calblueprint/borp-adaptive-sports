import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export const HEIGHT = 88;

export default StyleSheet.create({
  wrap: { gap: 10 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  caption: { fontSize: 13, fontWeight: '600', color: colors.tertiary },
  readout: {
    fontSize: 13,
    color: colors.secondary,
    fontVariant: ['tabular-nums'],
  },
  readoutActive: { color: colors.ink, fontWeight: '600' },
  plot: { height: HEIGHT + 1 },
  guide: {
    position: 'absolute',
    right: 0,
    fontSize: 11,
    fontWeight: '600',
    color: colors.tertiary,
    backgroundColor: colors.white,
    paddingLeft: 4,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  tick: { fontSize: 12, color: colors.tertiary, fontVariant: ['tabular-nums'] },
});
