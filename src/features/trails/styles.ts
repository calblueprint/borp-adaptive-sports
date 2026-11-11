import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  page: { backgroundColor: colors.white },
  content: { padding: 16, gap: 16 },
  search: {
    ...typography.p1,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  error: { ...typography.p2, color: colors.red },
  card: { gap: 6 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  name: { ...typography.p1, fontWeight: '600', color: colors.black },
  meta: { ...typography.p2, color: colors.gray },
});
