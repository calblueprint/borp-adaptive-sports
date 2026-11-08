import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';

export default StyleSheet.create({
  header: {
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    position: 'absolute',
    top: 11,
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 8,
    backgroundColor: colors.white,
    boxShadow: '0px 0px 2.35px rgba(0, 0, 0, 0.08)',
  },
  left: { left: 16 },
  right: { right: 16 },
});
