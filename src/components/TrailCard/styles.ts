import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  card: { gap: 12 },
  pressed: { opacity: 0.75 },
  media: { aspectRatio: 1.6, borderRadius: 16 },
  // The hit area's padding puts the heart itself 16pt in from the corner, like the tag and the map, and level with the tag
  heart: { top: 12, right: 6 },
  text: { gap: 2 },
  name: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 15, lineHeight: 20, color: colors.secondary },
});
