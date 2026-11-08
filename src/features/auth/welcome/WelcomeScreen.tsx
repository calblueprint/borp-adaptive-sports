import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Button from '@/components/Button/Button';
import GoogleG from '@/icons/google.svg';
import styles from './styles';
import WelcomeLogo from './WelcomeLogo';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <WelcomeLogo />
      </View>

      <View style={styles.bottom}>
        <View style={styles.buttons}>
          {/* TODO: hook up Google sign-in */}
          <Button
            text="Continue with Google"
            icon={<GoogleG width={19} height={19} />}
            onPress={() => {}}
          />
          <Button
            text="Continue with Email"
            variant="secondary"
            onPress={() => router.push('/login')}
          />
        </View>
        <Text style={styles.policy}>
          By continuing, you agree to Borp’s{' '}
          <Text style={styles.policyLink}>Usage Policy</Text> and acknowledge
          their <Text style={styles.policyLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
