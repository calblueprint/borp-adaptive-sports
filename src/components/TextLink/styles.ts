import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  link: { alignSelf: 'flex-start' },
  text: {
    ...typography.p1,
    fontWeight: '500',
    color: colors.navy,
    textDecorationLine: 'underline',
  },
  disabled: { color: colors.gray },
});
