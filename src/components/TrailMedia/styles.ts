import { StyleSheet } from 'react-native';
import { colors, shadow, trailColors } from '@/styles/theme';

export default StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: trailColors.mapLand },
  fill: { width: '100%', height: '100%' },
  // White keyline and a soft shadow keep the corner square readable on any photo. The shadow lives on
  // the outer view because iOS clips shadows on a view that also clips its content.
  inset: {
    position: 'absolute',
    backgroundColor: colors.white,
    padding: 2,
    ...shadow.raised,
  },
  insetClip: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: trailColors.mapLand,
  },
  insetPressed: { opacity: 0.8 },
  // White to match the heart's outline and the map's keyline; the shadow keeps it apart from the light map
  label: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    ...shadow.raised,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.1,
  },
});
