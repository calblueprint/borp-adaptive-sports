import * as Linking from 'expo-linking';

export function getAuthRedirectUrl() {
  return Linking.createURL('auth/callback');
}
