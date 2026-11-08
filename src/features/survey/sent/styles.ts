import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, alignItems: 'center', padding: 24 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  check: { ...typography.h1, color: colors.white },
  title: { ...typography.h2, marginTop: 24 },
  subtitle: {
    ...typography.p2,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  next: { alignSelf: 'stretch', marginTop: 32, gap: 16 },
  nextHeading: { ...typography.p3, color: colors.gray },
  step: { flexDirection: 'row', gap: 12 },
  dotDone: { ...typography.p1, color: colors.black },
  dot: { ...typography.p1, color: colors.lightGray },
  stepTitle: { ...typography.p1, fontWeight: '600' },
  stepTitleMuted: { ...typography.p1, fontWeight: '600', color: colors.gray },
  stepNote: { ...typography.p3, color: colors.gray },
  footer: { padding: 24, backgroundColor: colors.white },
});
