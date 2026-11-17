import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';

export default StyleSheet.create({
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  pinBadge: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadgeText: { fontSize: 15, fontWeight: '600', color: colors.black },
  pinText: { flex: 1 },
  pinTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.26,
    color: colors.black,
  },
  pinMeta: { fontWeight: '400', color: colors.textTertiary },
  pinNotes: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.18,
    color: colors.navy,
    paddingTop: 2,
  },
  pinNotesEmpty: { color: colors.textTertiary },
});
