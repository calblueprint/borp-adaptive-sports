import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export default StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  headSpread: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  // A thumb-sized target where the title is big or asks something of you
  headTall: { minHeight: 44, alignItems: 'center' },
  headInvite: { gap: 6 },
  link: { color: colors.ink },
  invite: { fontSize: 17, color: colors.navy },
  aside: { fontSize: 13, color: colors.tertiary },
  pressed: { opacity: 0.6 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingVertical: 14,
    marginHorizontal: -GUTTER,
    paddingHorizontal: GUTTER,
  },
  rowPressed: { backgroundColor: colors.fill },
  insetDivider: {
    position: 'absolute',
    top: 0,
    left: GUTTER,
    right: GUTTER,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },

  empty: { gap: 16 },
});
