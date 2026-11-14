import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export const TAB_BAR_HEIGHT = 54;
/** Side inset of the floating bar. */
export const DOCK_INSET = 20;

const PAD = 4;
export const TAB_W = 64;
const TAB_H = TAB_BAR_HEIGHT - PAD * 2;
const FULL_W = TAB_W * 2 + PAD * 2;

export default StyleSheet.create({
  // The tabs are centred, in reach of either thumb and in the same spot on every tab; the accessory (the +)
  // sits apart at the right, so it reads as an action rather than a third tab
  wrap: {
    position: 'absolute',
    left: DOCK_INSET,
    right: DOCK_INSET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessory: { position: 'absolute', right: 0 },
  // Fill, blur and shadow come from <Glass>
  tabs: { width: FULL_W, height: TAB_BAR_HEIGHT },
  row: { flexDirection: 'row', padding: PAD, width: FULL_W },
  tab: {
    width: TAB_W,
    height: TAB_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A faint grey capsule (like iOS 26) reads on both Liquid Glass and the white frost fallback
  pill: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: TAB_W,
    height: TAB_H,
    borderRadius: TAB_H / 2,
    backgroundColor: colors.wash,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarOn: { borderWidth: 2, borderColor: colors.stone },
  avatarFilled: { backgroundColor: colors.stone },
});
