import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  // The grey of the other secondary buttons (the soft variant is the welcome screen's, on navy)
  cta: { backgroundColor: colors.fill },
  map: { marginBottom: 4 },

  thItem: { gap: 8, paddingBottom: 4 },
  th: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  thPhotos: { gap: 12 },
  thValue: { flex: 1, fontSize: 17, color: colors.ink },
  thNone: { color: colors.tertiary },

  note: { fontSize: 17, lineHeight: 24, color: colors.ink },
});
