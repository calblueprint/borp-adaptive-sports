import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../features/auth/AuthProvider';
import styles from '../../../styles/surveySentStyles';

const STEPS = [
  { title: 'Sent to BORP', note: new Date().toLocaleDateString(), done: true },
  {
    title: 'BORP reviews it',
    note: "Usually within a week. We'll let you know.",
    done: false,
  },
  {
    title: 'Published on Access California',
    note: 'Once approved, the trail page updates',
    done: false,
  },
];

export default function SurveySentScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const name = session?.user.email?.split('@')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>Thanks, {name}!</Text>
        <Text style={styles.subtitle}>BORP has received your survey.</Text>

        <View style={styles.next}>
          <Text style={styles.nextHeading}>What happens next</Text>
          {STEPS.map(step => (
            <View key={step.title} style={styles.step}>
              <Text style={step.done ? styles.dotDone : styles.dot}>
                {step.done ? '●' : '○'}
              </Text>
              <View>
                <Text
                  style={step.done ? styles.stepTitle : styles.stepTitleMuted}
                >
                  {step.title}
                </Text>
                <Text style={styles.stepNote}>{step.note}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
