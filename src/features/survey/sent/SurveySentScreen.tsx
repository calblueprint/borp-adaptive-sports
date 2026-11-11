import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '@/components/Button/Button';
import { useProfile } from '@/features/profile/ProfileProvider';
import CheckLarge from '@/icons/check-large.svg';
import CheckSmall from '@/icons/check-small.svg';
import colors from '@/styles/colors';
import styles from './styles';

export default function SurveySentScreen() {
  const { profile } = useProfile();
  const router = useRouter();
  const name = profile?.name ?? 'there';
  const sentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.successCheck}>
            <CheckLarge width={40} height={40} color={colors.white} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>Thanks, {name}!</Text>
            <Text style={styles.subtitle}>Your survey is with BORP.</Text>
          </View>
        </View>

        <View style={styles.next}>
          <Text style={styles.nextHeading}>What happens next</Text>

          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.dot, styles.dotDone]}>
                  <CheckSmall width={12} height={12} color={colors.white} />
                </View>
                <View style={[styles.line, styles.lineDone]} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Sent to BORP</Text>
                <Text style={styles.stepDetail}>{sentDate}</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.dot, styles.dotCurrent]}>
                  <View style={styles.dotInner} />
                </View>
                <View style={styles.line} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>BORP reviews it</Text>
                <Text style={styles.stepDetail}>
                  Usually within a week. We’ll let you know.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.dot, styles.dotNext]} />
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepTitle, styles.mutedText]}>
                  Published on Access California
                </Text>
                <Text style={styles.stepDetail}>
                  Once approved, the trail page updates
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button text="Done" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}
