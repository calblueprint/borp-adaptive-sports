import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: GUTTER, gap: 36 },
  heading: { gap: 6 },
  subtitle: { fontSize: 15, lineHeight: 21, color: colors.secondary },

  footer: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.tertiary,
    marginTop: 8,
  },

  // Full-bleed (ListRow) so the pressed highlight runs edge to edge; the hairlines stay inside the gutter
  row: { gap: 16 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 17, color: colors.ink },
  rowDetail: { fontSize: 13, lineHeight: 18, color: colors.tertiary },
  rowValue: { maxWidth: '50%', fontSize: 15, color: colors.secondary },
});
