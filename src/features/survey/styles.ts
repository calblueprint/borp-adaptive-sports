import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingBottom: 48 },
  title: { ...typography.h2, marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { ...typography.h4, marginBottom: 12 },
  reviewButton: { marginTop: 8 },
  message: { marginTop: 12, textAlign: 'center', color: colors.gray },
  backButton: { marginBottom: 16 },
  eyebrow: { ...typography.p3, color: colors.gray, marginBottom: 4 },
  reviewSectionTitle: { ...typography.p3, color: colors.gray, marginBottom: 8 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  reviewLabel: { ...typography.p2, flex: 1 },
  reviewValue: {
    ...typography.p2,
    color: colors.gray,
    flex: 1,
    textAlign: 'right',
  },
  footer: { padding: 24, backgroundColor: colors.white },
});
