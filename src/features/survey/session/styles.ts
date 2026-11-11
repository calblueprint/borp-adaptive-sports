import { StyleSheet } from 'react-native';
import { colors, GUTTER, shadow } from '@/styles/theme';

export default StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.pressed }, // the map's backdrop while it loads

  statusWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  status: { height: 44 },
  statusInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  finish: { position: 'absolute', right: 16, height: 44 },
  finishHit: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  finishText: { fontSize: 15, fontWeight: '600', color: colors.ink },

  float: { position: 'absolute', left: 16, right: 16 },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  coachTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  coachText: { fontSize: 15, color: colors.secondary, marginTop: 1 },
  pinIt: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  pinItText: { fontSize: 15, fontWeight: '600', color: colors.white },
  spotGlyph: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lastSurvey,
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 16,
  },
  toastGlyph: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.white },
  toastAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    textDecorationLine: 'underline',
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: GUTTER,
    gap: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    ...shadow.float,
    shadowOffset: { width: 0, height: -2 }, // a sheet casts upward
    elevation: 8,
  },
  // Full-width drag/tap target around the grabber
  handle: {
    height: 24,
    marginHorizontal: -GUTTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.quaternary,
  },
  // One text system: trail name 20 semibold, rows and meta 15, captions 13 semibold
  sheetBody: { gap: 24 },
  sheetHead: { gap: 4 },
  sheetMeta: {
    fontSize: 15,
    color: colors.secondary,
    fontVariant: ['tabular-nums'],
  },
  trailName: { fontSize: 20, fontWeight: '600', color: colors.ink },
  // Full width, so a picked row's fill reaches the sheet's edges
  detailsScroll: { marginHorizontal: -GUTTER },
  details: { gap: 32, paddingBottom: 8, paddingHorizontal: GUTTER },

  caption: { marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 },
  // Picked or pressed: full-bleed fill, like an iOS list row
  rowOn: {
    backgroundColor: colors.fill,
    marginHorizontal: -GUTTER,
    paddingHorizontal: GUTTER,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  rowGlyph: { width: 26, alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.ink },
  rowDone: { color: colors.secondary },
  rowWas: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.tertiary,
    fontVariant: ['tabular-nums'],
  },
  rowFound: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },

  recording: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.recordingTint,
  },
  recordingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.recording,
    fontVariant: ['tabular-nums'],
  },

  // Main capture actions: 56pt
  actions: { flexDirection: 'row', gap: 10 },
  dropPin: { height: 56, borderRadius: 28 },
  mic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
  micRec: { backgroundColor: colors.recording },
  resume: { backgroundColor: colors.fill },
});
