import { StyleSheet } from 'react-native';
import { colors, layout } from '@/styles/theme';

export default StyleSheet.create({
  flex: { flex: 1 },
  fields: { gap: 13 },
  phoneGroup: { gap: 8 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  ink: { color: colors.ink },
  cc: {
    width: 91,
    height: layout.fieldHeight,
    paddingLeft: 16.5,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  ccCaret: { position: 'absolute', left: 57.5, top: 15.5 },
  spacer: { flex: 1 },
});
