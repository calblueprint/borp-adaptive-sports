import { Alert, Platform } from 'react-native';

/** Stands in for a screen that isn't designed yet. */
export function comingSoon(what: string) {
  const msg = `${what} is the next screen we’ll design.`;
  if (Platform.OS === 'web') return console.info(msg);
  Alert.alert('Coming next', msg);
}
