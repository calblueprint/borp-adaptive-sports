import { StyleSheet } from 'react-native';
import { colors, layout } from '@/styles/theme';

export default StyleSheet.create({
  button: {
    height: layout.buttonHeight,
    borderRadius: 24,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  large: { height: 56, borderRadius: 28 },
  soft: { backgroundColor: colors.soft },
  disabled: { backgroundColor: colors.disabled },
  // Waiting on steps: a light track that fills with the disabled grey
  filling: { backgroundColor: colors.fill, overflow: 'hidden' },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.disabled,
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
});
