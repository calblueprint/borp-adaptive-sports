import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 24 },
  heading: { gap: 16 },
  title: { ...typography.h2, fontWeight: '600', color: colors.black },
  subtitle: { ...typography.p2, color: colors.gray },
  body: { paddingTop: 36, gap: 13 },
  footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 },
});
