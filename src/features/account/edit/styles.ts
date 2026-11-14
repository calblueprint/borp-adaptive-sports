import { StyleSheet } from 'react-native';
import { colors, shadow } from '@/styles/theme';

export const BADGE = 36;

export default StyleSheet.create({
  pressed: { opacity: 0.7 },
  photoBlock: { alignItems: 'center', gap: 14 },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.raised,
  },
  remove: { fontSize: 15, fontWeight: '500', color: colors.secondary },
  fields: { gap: 20 },
  readonly: { gap: 6 },
  hint: { fontSize: 13, color: colors.tertiary },
});
