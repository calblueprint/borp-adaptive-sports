import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  question: { gap: 4, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  rowLabel: { fontSize: 15, color: colors.ink },
  rowWas: {
    flex: 1,
    fontSize: 15,
    color: colors.tertiary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  note: {
    minHeight: 96,
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.fill,
  },
  talk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.fill,
  },
  talkRec: { backgroundColor: colors.recordingTint },
  talkPressed: { opacity: 0.6 },
  talkStop: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.recording,
  },
  talkText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
});
