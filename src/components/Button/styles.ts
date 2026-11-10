import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  button: {
    backgroundColor: colors.black,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  pressed: { opacity: 0.8 },
  disabled: { backgroundColor: colors.lightGray },
  text: { ...typography.p1, color: colors.white, fontWeight: '600' },
  disabledText: { color: colors.gray },
});
