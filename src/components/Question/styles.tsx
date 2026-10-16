import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  question: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: '600' },
  options: { marginTop: 6, marginLeft: 4 },
  hint: { fontSize: 13, fontStyle: 'italic', color: '#777', marginBottom: 4 },
  option: { fontSize: 15, color: '#444', lineHeight: 28 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  notes: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: { color: '#b00020', marginTop: 4 },
});
