import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';

// Same type scale as the review screen (Figma "Review and send")
export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 28,
  },
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

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: colors.controlFill,
  },
  chipSelected: { backgroundColor: colors.black },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.26,
    color: colors.black,
  },
  chipTextSelected: { fontWeight: '600', color: colors.white },
  pressed: { opacity: 0.7 },

  notes: {
    minHeight: 96,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.controlFill,
    fontSize: 15,
    letterSpacing: -0.26,
    color: colors.black,
    textAlignVertical: 'top',
  },

  addPin: { gap: 12 },
  success: { fontSize: 14, color: colors.success, textAlign: 'center' },
  error: { fontSize: 14, color: colors.red, textAlign: 'center' },

  loading: { paddingVertical: 24 },
  empty: { fontSize: 15, color: colors.textSecondary, paddingVertical: 12 },

  footer: { paddingHorizontal: 24, paddingVertical: 16 },
  finishButton: { backgroundColor: colors.controlFill },
});
