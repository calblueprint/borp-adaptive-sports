import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';

export default StyleSheet.create({
  container: { gap: 16 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    width: 111.3,
    height: 96,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.controlFill,
  },
  pressed: { opacity: 0.7 },
  tileLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.26,
    color: colors.black,
  },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 6 },
  thumb: { width: 64, height: 64 },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.photoPlaceholder,
  },
  remove: {
    position: 'absolute',
    left: 50,
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
