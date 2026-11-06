import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 60 },
  title: { ...typography.h2, marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    ...typography.h4,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  message: { ...typography.p2, marginTop: 12 },
});
