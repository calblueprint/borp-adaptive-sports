import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.fill,
  },
  pressed: { backgroundColor: colors.pressed },
  text: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
