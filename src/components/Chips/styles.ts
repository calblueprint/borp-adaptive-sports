import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.fill,
  },
  // The icon's side gets a little less padding, so the pill still looks evenly padded
  chipWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
  },
  // The last survey's answer: a step darker than a pressed chip, so it never looks mid-tap
  chipLast: { backgroundColor: colors.previous },
  chipLastPressed: { backgroundColor: colors.previousPressed },
  chipPressed: { backgroundColor: colors.pressed },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontSize: 15, fontWeight: '500', color: colors.ink },
  chipTextOn: { fontWeight: '600', color: colors.white },
});
