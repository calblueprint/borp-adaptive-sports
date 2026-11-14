import { StyleSheet } from 'react-native';
import { colors, trailColors } from '@/styles/theme';

export default StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  pressed: { opacity: 0.85 },
  photo: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: trailColors.mapLand,
    marginBottom: 10,
  },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 15, lineHeight: 20, color: colors.secondary, marginTop: 2 },
  heart: { top: 6, right: 6 },
});
