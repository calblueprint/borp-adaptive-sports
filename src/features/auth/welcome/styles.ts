import { StyleSheet } from 'react-native';
import colors from '@/styles/colors';
import { typography } from '@/styles/typography';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  logo: { width: 171, height: 171 },
  layer: { position: 'absolute', top: 0, left: 0, width: 171, height: 171 },
  wheelchair: { left: 2.7 },
  speedLine: { position: 'absolute', top: 0, width: 187.4, height: 171 },

  bottom: { paddingHorizontal: 16, paddingBottom: 16, gap: 17 },
  buttons: { gap: 10 },
  policy: {
    ...typography.p3,
    fontWeight: '500',
    color: colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  policyLink: { textDecorationLine: 'underline' },
});
