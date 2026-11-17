import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';

// Matches the "Review and send" frame in Figma
export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: 24, paddingBottom: 48, gap: 32 },
  backButton: { marginTop: 8 },
  heading: { gap: 4 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.black,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.26,
    color: colors.textSecondary,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.095,
    color: colors.textTertiary,
  },
  loading: { paddingVertical: 24 },
  empty: { fontSize: 15, color: colors.textSecondary, paddingVertical: 12 },
  message: { textAlign: 'center', color: colors.red },

  footer: { paddingHorizontal: 24, paddingVertical: 16, gap: 12 },
});
