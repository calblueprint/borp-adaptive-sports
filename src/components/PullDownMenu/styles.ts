import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export const WIDTH = 200;
export const ROW = 48;
export const PAD = 6;

export default StyleSheet.create({
  menu: { position: 'absolute', width: WIDTH },
  list: { padding: PAD },
  // Leading check column, like iOS menus, so labels line up whether or not they're picked
  row: {
    height: ROW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  rowPressed: { backgroundColor: colors.fill },
  check: { width: 22, alignItems: 'center' },
  label: { fontSize: 17, color: colors.ink },
});
