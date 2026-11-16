import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 47,
    backgroundColor: colors.black,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  secondary: { backgroundColor: colors.white },
  pressed: { opacity: 0.8 },
  disabled: { backgroundColor: colors.lightGray },
  text: { ...typography.p1, color: colors.white, fontWeight: '500' },
  secondaryText: { color: colors.black },
  disabledText: { color: colors.white },
});
