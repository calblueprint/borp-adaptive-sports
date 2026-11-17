import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { tabBarClearance } from '@/styles/layout';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { padding: 16, paddingBottom: tabBarClearance, gap: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  name: { ...typography.h2, color: colors.black },
  meta: { ...typography.p2, color: colors.gray },
  heading: { ...typography.h4, color: colors.black, marginTop: 16 },
  row: { paddingVertical: 12, gap: 2 },
  rowTitle: { ...typography.p1, fontWeight: '600', color: colors.black },
  error: { ...typography.p2, color: colors.red },
  surveyRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  surveyText: { flex: 1, gap: 2 },
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 16,
  },
  chip: {
    backgroundColor: colors.lightGray,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: { backgroundColor: colors.navy },
  chipText: { ...typography.p2, color: colors.black },
  chipTextSelected: { color: colors.white },
  footer: { paddingVertical: 16 },
  logout: { marginTop: 24 },
});
