// Survey sent — not in Figma yet. Replaces Review and send. The survey is saved on the phone first and
// sends by itself once there's signal (faked: a few seconds), then shows what happens next.
// No going back into the finished session: Done returns to the trail, or jump to it in the profile.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { RollingLoader } from '@/components/BorpLogo/RollingLoader';
import { BottomBar } from '@/components/BottomBar/BottomBar';
import { Icon } from '@/components/Icon/Icon';
import { Section } from '@/components/List/List';
import { NextSteps, Stats } from '@/components/SurveySummary/SurveySummary';
import { useAccount } from '@/features/account/AccountProvider';
import { formatElapsed, useSurvey } from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { comingSoon } from '@/lib/comingSoon';
import { colors, spring, type } from '@/styles/theme';
import styles from './styles';

export default function SentScreen() {
  const { id, sub: subId } = useLocalSearchParams<{
    id: string;
    sub: string;
  }>();
  const trail = useTrails().getTrail(id);
  const sub = useSurvey().submissions.find(s => s.id === subId);
  const { user } = useAccount();
  const insets = useSafeAreaInsets();
  const waiting = sub?.status === 'waiting';

  // Back gesture / Android back = Done
  const [leaving, setLeaving] = useState(false);
  const allowLeave = usePreventRemove(!leaving, () => done());
  function leave(go: () => void) {
    setLeaving(true);
    allowLeave();
    go();
  }
  function done() {
    leave(() =>
      router.dismissTo({ pathname: '/prototype/trail/[id]', params: { id } }),
    );
  }
  // Your surveys in the profile come with the account screens; until then this says so
  function openInProfile() {
    comingSoon('Your surveys in the profile');
  }

  useEffect(() => {
    if (!waiting && sub)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [waiting, sub]);

  if (!trail || !sub) return null;
  const first = user.name.split(' ')[0];

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 56, paddingBottom: 170 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero} accessibilityLiveRegion="polite">
          <View style={styles.mark}>
            {waiting ? (
              <Animated.View key="wait" entering={FadeIn.duration(200)}>
                <RollingLoader size={64} color={colors.navy} />
              </Animated.View>
            ) : (
              <Animated.View
                key="sent"
                entering={ZoomIn.springify(spring.pop.duration).dampingRatio(
                  spring.pop.dampingRatio,
                )}
                style={styles.check}
              >
                <Icon
                  name="check"
                  size={40}
                  color={colors.white}
                  strokeWidth={2.6}
                />
              </Animated.View>
            )}
          </View>
          <Text style={[type.title, styles.center]} accessibilityRole="header">
            {waiting ? 'Saved on your phone' : `Thanks, ${first}!`}
          </Text>
          <Text style={styles.subtitle}>
            {waiting
              ? trail.name
              : `Your survey of ${trail.name} is with BORP.`}
          </Text>
        </View>

        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <Stats
            items={[
              { value: sub.miles.toFixed(1), unit: 'mi', label: 'Walked' },
              { value: formatElapsed(sub.elapsed), label: 'On the trail' },
              {
                value: String(sub.pins.length),
                label: sub.pins.length === 1 ? 'Pin' : 'Pins',
              },
            ]}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(300)}>
          <Section title="What happens next">
            <NextSteps
              status={sub.status}
              sentAt={sub.sentAt}
              reviewedAt={sub.review?.at}
            />
          </Section>
        </Animated.View>
      </ScrollView>

      <BottomBar style={styles.cta}>
        <ActionButton label="Done" size="large" onPress={done} />
        <Pressable
          onPress={openInProfile}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.link}
        >
          <Text style={styles.linkText}>See it in your profile</Text>
        </Pressable>
      </BottomBar>
    </View>
  );
}
