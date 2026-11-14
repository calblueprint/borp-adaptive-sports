import { StyleSheet } from 'react-native';
import { colors, GUTTER } from '@/styles/theme';

export default StyleSheet.create({
  pressed: { opacity: 0.6 },

  // Sheet: the grabber sits above, so the title starts close to the top
  top: { paddingTop: 20, paddingHorizontal: GUTTER, gap: 12, paddingBottom: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  cancel: { height: 48, justifyContent: 'center', paddingLeft: 16 },
  cancelText: { fontSize: 17, color: colors.navy },

  list: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 40 },
  section: { marginTop: 24 },

  // A sheet of places to scan: a little tighter than a settings row
  row: { paddingVertical: 10 },
  rowIcon: { width: 24, alignItems: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 17, color: colors.ink },
  match: { fontWeight: '600' },
  rowDetail: { fontSize: 14, color: colors.secondary },

  // Looks like a button, but the whole row is the tap target
  // Same grey fill and black label as the other secondary buttons
  turnOn: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
  turnOnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  empty: { fontSize: 15, color: colors.secondary, paddingVertical: 16 },
});
