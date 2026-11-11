import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  pressed: { opacity: 0.6 },

  // Same corner radius as the search and location bars it sits under
  reminder: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 48,
    borderRadius: 14,
    backgroundColor: colors.tint,
  },
  reminderIcon: { paddingTop: 1 }, // optically centres the arrow on the title's cap height
  reminderText: { flex: 1, alignItems: 'flex-start' },
  reminderTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  reminderBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondary,
    marginTop: 2,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: colors.navy,
  },
  // A darker fill rather than fading, so the label keeps its contrast while pressed
  reminderButtonPressed: { backgroundColor: colors.navyPressed },
  reminderButtonText: { fontSize: 15, fontWeight: '600', color: colors.white },
  // 48pt square in the corner; the × itself lines up with the title
  reminderClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
