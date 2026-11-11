import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * End of the auth flow: confirm, then land on the trail list (home) with the auth screens cleared
 * from the stack so swiping back doesn't return to them.
 */
export function finishAuth(title: string, onReset: () => void) {
  const enter = () => {
    onReset();
    router.dismissAll();
    router.replace('/prototype/trails');
  };
  if (Platform.OS === 'web') return enter();
  Alert.alert(title, 'Let’s find a trail to survey.', [
    { text: 'Continue', onPress: enter },
  ]);
}
