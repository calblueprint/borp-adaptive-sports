import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24, paddingBottom: 48, gap: 16 },
  eyebrow: { fontSize: 14, color: '#666' },
  title: { fontSize: 24, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeButton: {
    width: '30%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
  },
  typeButtonText: { fontSize: 14, fontWeight: '600' },
  notes: {
    minHeight: 96,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlignVertical: 'top',
  },
  message: { fontSize: 14 },
  footer: { padding: 24 },
});
