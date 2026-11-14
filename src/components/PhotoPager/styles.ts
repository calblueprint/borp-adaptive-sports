import { StyleSheet } from 'react-native';
import { colors, overlay } from '@/styles/theme';

export const ARROW = 28;

export default StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  // Airbnb's: small white dots, the current one solid; a soft shadow keeps them readable on bright sky
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: overlay.dot,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  dotOn: { backgroundColor: colors.white },
  arrows: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // A white chevron on a see-through dark fill, like the card's heart: readable on any photo, quieter than
  // the white glass buttons above it
  arrow: {
    width: ARROW,
    height: ARROW,
    borderRadius: ARROW / 2,
    backgroundColor: overlay.scrim,
  },
  arrowHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ARROW / 2,
  },
  arrowPressed: { transform: [{ scale: 0.92 }] },
  flip: { transform: [{ scaleX: -1 }] },
});
