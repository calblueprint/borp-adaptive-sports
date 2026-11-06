import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

const inputBase = {
  ...typography.p1,
  borderWidth: 1,
  borderColor: colors.lightGray,
  borderRadius: 6,
  padding: 8,
  marginTop: 6,
};

export default StyleSheet.create({
  question: { marginBottom: 14 },
  label: { ...typography.p1, fontWeight: '600' },
  options: { marginTop: 6, marginLeft: 4 },
  hint: {
    ...typography.p2,
    fontStyle: 'italic',
    color: colors.gray,
    marginBottom: 4,
  },
  option: { ...typography.p1, lineHeight: 28 },
  input: inputBase,
  notes: { ...inputBase, minHeight: 80, textAlignVertical: 'top' },
  error: { ...typography.p2, color: colors.red, marginTop: 4 },
});
