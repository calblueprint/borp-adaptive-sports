import { StyleSheet } from 'react-native';
import { material, shadow } from '@/styles/theme';

export default StyleSheet.create({
  solid: { ...shadow.float, backgroundColor: material.glassFallback },
  // A light rim helps the frosted edge read against the white list
  frost: {
    ...shadow.float,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: material.glassRim,
  },
  clip: { overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill },
  frostLight: { backgroundColor: material.frostLight },
  frostDark: { backgroundColor: material.frostDark },
  frostDarkSolid: { backgroundColor: material.frostDarkSolid },
  // Keeps white text readable on a bright photo
  frostDarkTint: { backgroundColor: material.frostDarkTint },
});
