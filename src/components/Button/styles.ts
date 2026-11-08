import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

const titleBase = {
  ...typography.p1,
  paddingHorizontal: 24,
  paddingVertical: 5,
};

export default StyleSheet.create({
  disabledStyle: {
    borderRadius: 5,
    backgroundColor: colors.lightGray,
  },
  buttonStyle: {
    borderRadius: 5,
    backgroundColor: colors.black,
  },
  titleStyle: {
    ...titleBase,
    color: colors.white,
  },
  disabledTitleStyle: {
    ...titleBase,
    color: colors.black,
  },
});
