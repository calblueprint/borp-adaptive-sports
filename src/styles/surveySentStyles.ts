import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, alignItems: 'center', padding: 24 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1c1c5a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  check: { color: '#ffffff', fontSize: 40 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 24 },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  next: { alignSelf: 'stretch', marginTop: 32, gap: 16 },
  nextHeading: { fontSize: 12, color: '#666666' },
  step: { flexDirection: 'row', gap: 12 },
  dotDone: { fontSize: 16, color: '#000000' },
  dot: { fontSize: 16, color: '#bbbbbb' },
  stepTitle: { fontSize: 15, fontWeight: '600' },
  stepTitleMuted: { fontSize: 15, fontWeight: '600', color: '#999999' },
  stepNote: { fontSize: 12, color: '#999999' },
  footer: { padding: 24 },
  button: {
    backgroundColor: '#000000',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
