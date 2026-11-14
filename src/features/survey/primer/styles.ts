import { StyleSheet } from 'react-native';
import { HAIR, surveyStyles } from '@/components/SurveyLayout/SurveyLayout';
import { colors, GUTTER } from '@/styles/theme';

export default StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.white },
  page: { paddingHorizontal: GUTTER, paddingBottom: 160 },
  card: { gap: 14 },
  art: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  body: { fontSize: 16, lineHeight: 24, color: colors.secondary },
  standards: {
    marginTop: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    ...HAIR,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  rowDivider: { borderTopWidth: 0.5, borderTopColor: colors.line },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink },
  rowValue: { fontSize: 15, fontWeight: '600', color: colors.ink },
  skip: { position: 'absolute', right: 24 },
  skipText: { ...surveyStyles.link, textDecorationLine: 'none' },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: GUTTER,
    gap: 18,
    backgroundColor: colors.white,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.disabled,
  },
  dotOn: { width: 18, backgroundColor: colors.ink },
});
