import { StyleSheet } from 'react-native';
import { HAIR } from '@/components/SurveyLayout/SurveyLayout';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  thumb: { borderRadius: 10, backgroundColor: colors.fill },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    ...HAIR,
  },
  play: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pressed,
    overflow: 'hidden',
  },
  noteFill: { height: '100%', backgroundColor: colors.ink },
  noteTime: {
    fontSize: 13,
    color: colors.secondary,
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'right',
  },
});
