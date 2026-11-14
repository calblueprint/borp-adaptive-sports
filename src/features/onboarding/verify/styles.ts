import { StyleSheet } from 'react-native';
import { colors, layout } from '@/styles/theme';

export default StyleSheet.create({
  cells: { flexDirection: 'row', gap: 14 },
  group: { flex: 1, flexDirection: 'row', gap: 6 },
  cell: {
    flex: 1,
    height: layout.fieldHeight + 9,
    borderWidth: 0.5,
    borderColor: colors.line,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  cellActive: { borderWidth: 1.5, borderColor: colors.ink },
  digit: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  // Sits over the cells so a tap anywhere focuses it; near-invisible rather than 0 so iOS still offers the code
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.01,
    color: 'transparent',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  spacer: { flex: 1 },
});
