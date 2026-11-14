import { StyleSheet } from 'react-native';
import { colors, layout } from '@/styles/theme';

export default StyleSheet.create({
  label: { color: colors.ink },
  input: {
    height: layout.fieldHeight,
    borderWidth: 0.5,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  inputReadonly: { backgroundColor: colors.fieldReadonly, borderWidth: 0.3 },
  inputError: { borderColor: colors.error, borderWidth: 1 },
  errorText: { color: colors.error },
  // outlineWidth only affects web previews (removes the browser focus ring the design doesn't have)
  inputText: {
    height: '100%',
    paddingHorizontal: 16.5,
    color: colors.ink,
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  inputTextReadonly: { color: colors.tertiary },
  withRight: { paddingRight: 48 },
  inputRight: { position: 'absolute', right: 11.5, top: 11.5 },
});
