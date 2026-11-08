import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  field: { gap: 6, alignSelf: 'stretch' },
  label: { ...typography.p2, fontWeight: '500', color: colors.black },
  box: {
    height: 47,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  readOnlyBox: { backgroundColor: colors.fieldFill },
  errorBox: { borderColor: colors.red },
  input: {
    ...typography.p1,
    height: '100%',
    paddingHorizontal: 16.5,
    color: colors.black,
  },
  inputWithIcon: { paddingRight: 48 },
  readOnlyText: { color: colors.gray },
  eyeButton: { position: 'absolute', right: 12.5, top: 11.5 },
  helper: { ...typography.p2, color: colors.gray },
  error: { ...typography.p2, color: colors.red },
});
