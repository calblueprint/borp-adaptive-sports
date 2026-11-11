import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  link: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.navy,
    textDecorationLine: 'underline',
    fontVariant: ['tabular-nums'],
  },
  pressed: { opacity: 0.6 },
});
