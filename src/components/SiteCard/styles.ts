import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  card: { gap: 6 },
  image: { width: '100%', height: 200, borderRadius: 20 },
  name: { ...typography.p1, fontWeight: '600', color: colors.black },
  meta: { ...typography.p2, color: colors.gray },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 12,
  },
  sheetImage: { width: '100%', height: 180, borderRadius: 20 },
  sheetName: { ...typography.h3, color: colors.black },
  close: { alignSelf: 'center', padding: 8 },
  closeText: { ...typography.p2, color: colors.gray },
});
