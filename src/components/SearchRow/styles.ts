import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export const SEARCH_HEIGHT = 48;
export const RADIUS = SEARCH_HEIGHT / 2;

export default StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: SEARCH_HEIGHT },
  measure: { position: 'absolute', top: 0, left: 0, opacity: 0 },
  docked: { height: SEARCH_HEIGHT },
  clip: { flex: 1, borderRadius: RADIUS, overflow: 'hidden' },
  chip: {
    height: SEARCH_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  // Liquid Glass answers the finger itself; elsewhere the glass darkens a touch
  chipPressed: { backgroundColor: colors.wash },
  // Never shrinks: the chip is sized to its measured width, so a squeeze would clip the label
  chipText: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
  },
  search: { flex: 1, minWidth: 0 },
});
