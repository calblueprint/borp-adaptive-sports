import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export const SHEET = 24; // the page rides up over the photo's bottom edge on rounded corners, Airbnb-style

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: GUTTER,
  },
  missingButton: { alignSelf: 'stretch' },
  secondary: { fontSize: 15, lineHeight: 20, color: colors.secondary },

  body: {
    marginTop: -SHEET,
    borderTopLeftRadius: SHEET,
    borderTopRightRadius: SHEET,
    backgroundColor: colors.white,
    paddingTop: 32,
    paddingHorizontal: GUTTER,
    gap: 56,
  },

  title: { gap: 8 },
  name: { marginTop: 2 },

  // Instrument readings: the number carries the weight, the unit and caption stay small
  readings: { flexDirection: 'row' },
  reading: { flex: 1, gap: 8, paddingRight: 8 },
  readingValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  readingUnit: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    color: colors.tertiary,
  },
  readingLabel: { fontSize: 13, color: colors.secondary },
  // The over one: the headline's navy ✗, small, and its words in navy
  word: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  readingOutside: { fontWeight: '600', color: colors.navy },

  first: { gap: 8 },
  firstTitle: { fontSize: 20, fontWeight: '600', color: colors.ink },
  note: { fontSize: 15, lineHeight: 21, color: colors.ink, marginTop: 12 },

  directions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  directionsPill: { height: 40, paddingHorizontal: 16, borderRadius: 20 },
  distance: { flex: 1, fontSize: 15, color: colors.secondary },

  // Same type as the readings' captions, so the two rows read as one system
  cell: { flex: 1, alignItems: 'flex-start', gap: 4, paddingRight: 8 },
  cellValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink,
    marginTop: 12,
  },
  cellDetail: { fontSize: 13, color: colors.secondary },

  // Full bleed, hairlines and press highlight alike, like the other lists
  more: {
    marginTop: -16,
    marginHorizontal: -GUTTER,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  // marginHorizontal 0: the list around it already bleeds
  moreRow: { gap: 10, minHeight: 60, paddingVertical: 0, marginHorizontal: 0 },
  moreLabel: { fontSize: 16, color: colors.ink },
  moreValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    color: colors.tertiary,
  },

  credits: { gap: 4, marginTop: -24 },
  credit: { fontSize: 12, lineHeight: 16, color: colors.tertiary },

  save: { position: 'absolute', right: 16 },
});
