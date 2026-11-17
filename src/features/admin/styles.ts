import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { ...typography.h2, color: colors.navy },
  heading: { ...typography.h4, color: colors.navy },
  text: { ...typography.p1, color: colors.black },
  muted: { ...typography.p2, color: colors.gray },
  link: {
    ...typography.p1,
    color: colors.blue,
    textDecorationLine: 'underline',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  search: {
    ...typography.p1,
    color: colors.black,
    borderColor: colors.gray,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  section: { gap: 12 },
  field: { gap: 4 },
  label: { ...typography.p2, color: colors.navy, fontWeight: '600' },
  error: { ...typography.p1, color: colors.red },
  photo: { width: '100%', height: 240, borderRadius: 8 },
});
