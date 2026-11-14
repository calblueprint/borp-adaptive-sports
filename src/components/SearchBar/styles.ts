import { StyleSheet } from 'react-native';
import { colors } from '@/styles/theme';

export default StyleSheet.create({
  // Filled rather than outlined, like the system search field
  bar: {
    height: 48,
    backgroundColor: colors.fill,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  pick: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // minWidth 0: lets the field narrow (e.g. beside the docked filter) without pushing the icon out
  text: { flex: 1, minWidth: 0, fontSize: 15, color: colors.ink },
  // outlineWidth/outlineColor only affect web previews
  input: {
    height: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  pressed: { opacity: 0.6 },
});
