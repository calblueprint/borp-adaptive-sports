import { StyleSheet } from 'react-native';
import { colors, trailColors } from '@/styles/theme';

export const BUBBLE = 32; // the list's pin bubbles (drawn 1.5 wider each side for the rim)

export default StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: 8 },
  // A box is allowed here: it *is* the thing (a map)
  frame: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: trailColors.mapLand,
  },
  // Full-bleed press/selection, like the other lists
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  rowOn: { backgroundColor: colors.fill },
  divider: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 24 + BUBBLE + 3 + 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  title: { fontSize: 16, fontWeight: '500', color: colors.ink },
  detail: { fontSize: 14, color: colors.secondary, marginTop: 2 },
  mile: { fontSize: 14, color: colors.tertiary, fontVariant: ['tabular-nums'] },
});
