import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { padding: 24, paddingBottom: 48 },
  title: { ...typography.h2, marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { ...typography.h4, flexShrink: 1 },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
  },
  pressed: { opacity: 0.6 },
  photoPicker: { marginBottom: 16 },
  reviewButton: { marginTop: 8 },
  message: { marginTop: 12, textAlign: 'center', color: colors.gray },
  backButton: { marginBottom: 16 },
  eyebrow: { ...typography.p3, color: colors.gray, marginBottom: 4 },
});
