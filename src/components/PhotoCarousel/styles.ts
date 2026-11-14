import { StyleSheet } from 'react-native';
import { colors, overlay } from '@/styles/theme';

export default StyleSheet.create({
  viewer: { flex: 1, backgroundColor: colors.ink },
  close: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overlay.fillOnDark,
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    gap: 2,
  },
  captionCount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  captionCredit: { fontSize: 13, color: overlay.textOnDark },
});
