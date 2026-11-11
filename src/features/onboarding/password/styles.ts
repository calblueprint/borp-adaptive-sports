import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  fields: { gap: 13 },
  rules: { gap: 8 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleMet: { color: colors.ok },
  spacer: { flex: 1 },
});
