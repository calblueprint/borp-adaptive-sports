import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
  },
  rowTitle: { fontSize: 16, color: colors.ink },
  rowDetail: { fontSize: 14, color: colors.secondary, marginTop: 2 },
  outside: { color: colors.navy, fontWeight: '500' },
});
