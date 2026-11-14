import { StyleSheet } from 'react-native';
import { colors, ios, overlay } from '@/styles/theme';

export default StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: overlay.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  alert: {
    width: 290,
    borderRadius: 30,
    backgroundColor: ios.alert,
    padding: 18,
    gap: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  copy: { gap: 6, paddingHorizontal: 4, paddingTop: 4 },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: ios.alertText,
    textAlign: 'center',
  },

  map: { height: 120, borderRadius: 16, overflow: 'hidden' },
  precise: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: ios.badge,
  },
  preciseText: { fontSize: 11, fontWeight: '600', color: ios.blue },

  buttons: { gap: 8 },
  button: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ios.alertButton,
  },
  buttonPressed: { backgroundColor: ios.alertButtonPressed },
  buttonText: { fontSize: 17, fontWeight: '500', color: ios.blue },
});
