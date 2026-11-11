import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  round: { position: 'absolute' },
  hit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fade the icon, not the glass: opacity below 1 stops Liquid Glass rendering
  pressed: { opacity: 0.6 },
});
