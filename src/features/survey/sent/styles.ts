import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingTop: 64, paddingHorizontal: 24, gap: 34 },

  hero: { alignItems: 'center', gap: 20 },
  successCheck: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { alignItems: 'center', gap: 10 },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: {
    ...typography.p2,
    lineHeight: 20,
    color: colors.gray,
    textAlign: 'center',
    maxWidth: 320,
  },

  next: { gap: 8 },
  nextHeading: { ...typography.p3, fontWeight: '600', color: colors.gray },
  steps: { gap: 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  rail: { width: 20, alignItems: 'center', gap: 3 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.black },
  dotCurrent: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navy,
  },
  dotNext: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  line: { width: 2, height: 31, backgroundColor: colors.lightGray },
  lineDone: { backgroundColor: colors.black },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { ...typography.p1, fontWeight: '600', color: colors.black },
  stepDetail: { ...typography.p3, color: colors.gray },
  mutedText: { color: colors.gray },

  footer: { padding: 24, backgroundColor: colors.white },
});
