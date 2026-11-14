import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  // Taller than a settings row: an icon and two lines
  row: { gap: 12, minHeight: 72, paddingVertical: 12 },
  mark: { width: 20, alignItems: 'center' },
  kind: { width: 28, alignItems: 'center' },
  text: { flex: 1, gap: 2 },
  detail: { fontVariant: ['tabular-nums'] },
  add: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.navy },
  edit: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  editPressed: { backgroundColor: colors.pressed },
});
