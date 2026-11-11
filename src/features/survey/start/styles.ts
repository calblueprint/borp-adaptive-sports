import { StyleSheet } from 'react-native';
import { colors, overlay, trailColors } from '@/styles/theme';

export default StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  detail: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  offline: { gap: 14 },
  map: {
    height: 156,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: trailColors.mapLand,
  },
  // Not downloaded yet: the map is there but faded back
  veil: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: overlay.veil,
  },
  offlineRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  offlineTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  doneMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingVertical: 12,
  },
  rowTitle: { fontSize: 16, color: colors.ink },
  // Packed: struck through and greyed, like a ticked reminder
  done: { color: colors.tertiary, textDecorationLine: 'line-through' },
  box: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.quaternary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.navy, borderColor: colors.navy },
});
