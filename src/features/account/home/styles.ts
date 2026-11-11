import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export const AVATAR = 88;
export const RING = 4;

export default StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: GUTTER, gap: 36, backgroundColor: colors.white },

  // You: the photo sits half over the map's bottom edge, in a white ring that cuts it out of the map
  me: { marginTop: -(AVATAR / 2 + RING), alignItems: 'flex-start' },
  mePressed: { opacity: 0.7 },
  avatarRing: {
    padding: RING,
    borderRadius: AVATAR / 2 + RING,
    backgroundColor: colors.white,
    marginLeft: -RING,
    marginBottom: 10,
  },
  meta: {
    fontSize: 15,
    color: colors.secondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  gear: { position: 'absolute', right: 16 },

  kind: { width: 32, alignItems: 'center' },
  rowMeta: { marginTop: 2, fontVariant: ['tabular-nums'] },

  empty: { paddingTop: 8 },

  bleed: { marginHorizontal: -GUTTER, marginTop: 8 },
  cards: { paddingHorizontal: GUTTER, gap: 14 },
});
