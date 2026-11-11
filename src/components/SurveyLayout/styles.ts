import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  statusBand: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { paddingHorizontal: GUTTER, gap: 32 },
  heading: { gap: 4 },
  eyebrow: { fontSize: 13, fontWeight: '500', color: colors.secondary },
  subtitle: { fontSize: 15, lineHeight: 20, color: colors.secondary },
  right: { position: 'absolute', right: 16, width: 44, height: 44 }, // RoundButton is 44pt

  bars: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
  },
  barOn: { backgroundColor: colors.ink },
});
