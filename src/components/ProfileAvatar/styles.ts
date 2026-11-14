import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  photo: { backgroundColor: colors.fill },
  initials: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontWeight: '600', color: colors.white, letterSpacing: 0.5 },
});
