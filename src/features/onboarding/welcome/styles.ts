import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  logo: { position: 'absolute', alignSelf: 'center' },
  actions: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 17,
  },
  stack: { alignSelf: 'stretch', gap: 10 },
  legal: {
    maxWidth: 357,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: colors.legal,
  },
  link: { textDecorationLine: 'underline' },
});
