import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 36, gap: 16 },
  title: { ...typography.h2, fontWeight: '600', color: colors.black },
  subtitle: { ...typography.p2, color: colors.gray },
  error: { ...typography.p2, color: colors.red },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    gap: 16,
    alignItems: 'stretch',
  },
});
