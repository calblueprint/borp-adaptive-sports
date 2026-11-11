import { StyleSheet } from 'react-native';
import { colors, GUTTER, trailColors, type } from '@/styles/theme';

export const THUMB = 64;

export default StyleSheet.create({
  flex: { flex: 1 },
  // The paused survey isn't a link, but lines up with the rows under it (ListRow's bleed and spacing)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    marginHorizontal: -GUTTER,
    paddingHorizontal: GUTTER,
  },
  // A note can run the text past the thumb; pin both to the top so the thumb doesn't float in the middle
  rowTop: { alignItems: 'flex-start' },
  chevron: { alignSelf: 'center' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: trailColors.mapLand,
  },
  meta: { ...type.rowDetail, marginTop: 2, fontVariant: ['tabular-nums'] },
  needsYou: { color: colors.navy },
  resume: { height: 40, paddingHorizontal: 16, borderRadius: 20 },
});
