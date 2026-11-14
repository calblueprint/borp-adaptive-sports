import { StyleSheet } from 'react-native';
import { SEARCH_HEIGHT } from '@/components/SearchRow/SearchRow';
import { colors, GUTTER } from '@/styles/theme';

export const SEARCH_TOP = 12;
export const ROW_BOTTOM = SEARCH_TOP + SEARCH_HEIGHT;
export const CONTROLS_HEIGHT = 44;
export const PILL_HEIGHT = 36;
export const PILL_PAD = 10;

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  list: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  // Pinned over the list; the fade is full-bleed and its lower 20pt is where cards fade out
  top: { position: 'absolute', left: 0, right: 0 },
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ROW_BOTTOM + 20,
  },
  searchRow: { marginTop: SEARCH_TOP, marginHorizontal: GUTTER },
  // Glass like the dock: the list scrolls under it. The clip is inside so the glass keeps its shadow, and it
  // stops the field spilling out while the docked filter squeezes it
  search: { height: SEARCH_HEIGHT },
  searchClip: { flex: 1, borderRadius: SEARCH_HEIGHT / 2, overflow: 'hidden' },
  searchField: {
    flex: 1,
    height: SEARCH_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: SEARCH_HEIGHT / 2,
    backgroundColor: 'transparent',
  },

  // Starts under the pinned search row
  // The location reminder collapses this gap away with it when dismissed (HEADER_GAP), so nothing jumps
  header: { paddingTop: ROW_BOTTOM, paddingBottom: 20, gap: 16 },

  // Sits close under the search field: both set what the list shows. Bleeds to the screen's edges so
  // words scroll off them, while the first word still lines up with the cards
  context: {
    height: CONTROLS_HEIGHT,
    marginTop: 4,
    marginHorizontal: -GUTTER,
    flexGrow: 0,
  },
  contextContent: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: GUTTER - PILL_PAD,
  },
  // Just words: no fill at rest, so there's no second material beside the glass search field. The padding
  // is there for the pressed capsule, so the words never shift
  pill: {
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: PILL_PAD,
    borderRadius: PILL_HEIGHT / 2,
  },
  pillPressed: { backgroundColor: colors.fill },
  pillText: { fontSize: 15, fontWeight: '500', color: colors.ink },
  pillPlace: { maxWidth: 160 },

  gap: { height: 28 },

  empty: { paddingTop: 20, gap: 4 },
  emptyActions: { flexDirection: 'row', gap: 24 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
  },
  emptyButtonText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
  },
});
