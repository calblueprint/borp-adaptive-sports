import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * End of the auth flow: confirm, then clear the auth screens from the stack so swiping back doesn't
 * return to them. Until the trail list is in, this lands back on the welcome screen.
 */
export function finishAuth(title: string, onReset: () => void) {
  const enter = () => {
    onReset();
    router.dismissAll();
  };
  if (Platform.OS === 'web') return enter();
  Alert.alert(title, 'Let’s find a trail to survey.', [
    { text: 'Continue', onPress: enter },
  ]);
}
