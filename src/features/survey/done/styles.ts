import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export const MARK = 88;

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: GUTTER, gap: 32 },
  hero: { alignItems: 'center', gap: 10 },
  mark: {
    width: MARK,
    height: MARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  // Navy, not green: the shape says "done", the one accent says it's ours
  check: {
    width: MARK,
    height: MARK,
    borderRadius: MARK / 2,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  // The link under Done sits close: it's the quieter way out
  cta: { gap: 4 },
  link: {
    alignSelf: 'center',
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  linkText: { fontSize: 15, fontWeight: '500', color: colors.navy },
});
