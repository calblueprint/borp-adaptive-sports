import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  flex: { flex: 1 },
  question: { gap: 16, paddingVertical: 24 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.6 },
  eyebrow: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.navy,
    marginBottom: 2,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 22 },
  label: { fontSize: 17, fontWeight: '600', color: colors.ink },
  capture: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  capturePressed: { backgroundColor: colors.fill },
  captureRecording: { backgroundColor: colors.recording },
  recording: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 22 },
  recordingText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.recording,
    fontVariant: ['tabular-nums'],
  },
  // Room for the thumbnails' remove badges, which sit outside the photo
  thumbsRow: { marginTop: -6, marginHorizontal: -6 },
  thumbs: { gap: 12, padding: 6 },
  notes: { gap: 8 },
  help: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.secondary,
    marginTop: -4,
  },
});
