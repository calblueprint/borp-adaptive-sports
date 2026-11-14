import { StyleSheet } from 'react-native';
import { colors, layout } from '@/styles/theme';

// Logo is vertically centred in this band; the nav button sits 11pt from its top (Figma y 73 − status bar 62).
const HEADER_HEIGHT = 62;

export default StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.white },
  header: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: layout.authGutter,
    paddingTop: layout.contentTop - HEADER_HEIGHT,
  },
  ink: { color: colors.ink },
  navButton: {
    position: 'absolute',
    top: layout.headerTop,
    padding: 8,
    borderRadius: 30,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 4.7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  navLeft: { left: layout.navInset },
  navRight: { right: layout.navInset - 1 },
  pressed: { opacity: 0.6 },
  heading: { gap: 16, marginBottom: 36 },
});
