import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

// Shared by the auth and profile forms
export default StyleSheet.create({
  error: { ...typography.p2, color: colors.red },
  message: { ...typography.p2, color: colors.gray },
  links: { gap: 16, paddingTop: 4 },
  rules: { gap: 8 },
});
