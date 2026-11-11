import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export const DOT = 20;

export default StyleSheet.create({
  flex: { flex: 1 },

  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: 2 },
  statValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
    color: colors.tertiary,
  },
  statLabel: { fontSize: 13, color: colors.tertiary },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowMi: {
    fontWeight: '400',
    color: colors.tertiary,
    fontVariant: ['tabular-nums'],
  },
  rowValue: { fontSize: 14, color: colors.secondary, marginTop: 2 },
  rowNeeds: { color: colors.navy, fontWeight: '500' },
  rowPhoto: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.fill,
  },

  step: { flexDirection: 'row', gap: 14 },
  rail: { width: DOT, alignItems: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1.5,
    borderColor: colors.quaternary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  dotNow: { borderColor: colors.ink, borderWidth: 6 },
  line: {
    flex: 1,
    width: 1.5,
    marginVertical: 3,
    backgroundColor: colors.hairline,
  },
  lineDone: { backgroundColor: colors.ink },
  stepBody: { flex: 1, gap: 3, paddingBottom: 20 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  stepTitleNext: { color: colors.tertiary },
  // Message bubble, tail corner top-left toward the step it answers (Messages / Airbnb inbox)
  bubble: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    backgroundColor: colors.fill,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, color: colors.ink },
});
