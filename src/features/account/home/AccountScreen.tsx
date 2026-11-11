// Profile tab — not in Figma yet (the Figma Profile page is empty); built as the same system as the trail
// page, so the two feel like one app:
//   - Your map: every trail you've surveyed, as its photo on one Bay Area map (Apple Photos' Places).
//     It's the "how much have I done" picture, so there's no stat row; one line under your name says it.
//   - You: photo overlapping the map, name, since when and how far. Tap to edit. Gear for settings.
//   - How you go on trails: the chair (walker, bike, on foot…) you're using now, with its icon, and its limits; tap to pick
//     another or add one. First, because every trail page compares with it. The rest live a page deeper.
//   - Surveys: what needs you first (a paused survey, one BORP sent back with their note), then by date.
//     The first three; once there are more, the caption opens them all.
//   - Saved: photo cards you swipe through, with the heart to unsave, like Airbnb's wishlists. The caption
//     opens them all as a gallery.
// No boxes except the map and the photos; groups are space and hairlines. Navy only where BORP needs you.
// One text system: section titles 20 semibold black (big enough to hit with a thumb where they're links),
// names 17 semibold black, everything under them 15 regular grey. No status glyphs: the word says it.
import type { MapSurvey } from '@/components/SurveyMap/SurveyMap';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AID_ICON, Icon } from '@/components/Icon/Icon';
import { Chevron, EmptyState, ListRow, Section } from '@/components/List/List';
import { ProfileAvatar } from '@/components/ProfileAvatar/ProfileAvatar';
import { RoundButton } from '@/components/RoundButton/RoundButton';
import { SavedCard } from '@/components/SavedCard/SavedCard';
import { SurveyMap } from '@/components/SurveyMap/SurveyMap';
import {
  InProgress,
  openSurvey,
  sortSurveys,
  SurveyRow,
} from '@/components/SurveyRows/SurveyRows';
import {
  SUBMISSION_LABEL,
  submissionNeedsYou,
} from '@/components/SurveySummary/SurveySummary';
import { tabBarClearance } from '@/components/TabBar/TabBar';
import { barButtonTop, TitleBar } from '@/components/TitleBar/TitleBar';
import {
  aidName,
  howYouGoHref,
  limitsLine,
  useAccount,
} from '@/features/account/AccountProvider';
import { useSurvey } from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { colors, type } from '@/styles/theme';
import styles, { AVATAR } from './styles';

const MAP_HEIGHT = 180;
const CARD = 168;
const SURVEYS_SHOWN = 3;

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, saved } = useAccount();
  const { submissions, session } = useSurvey();
  const { getTrail } = useTrails();

  const heroH = insets.top + MAP_HEIGHT;
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    y.set(e.contentOffset.y);
  });
  // Same as the trail page: the map drifts up slower than the page and stretches when pulled down
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          y.get(),
          [-200, 0, heroH],
          [-100, 0, heroH / 2],
          Extrapolation.CLAMP,
        ),
      },
      { scale: interpolate(y.get(), [-200, 0], [1.5, 1], Extrapolation.CLAMP) },
    ],
  }));

  const surveys = sortSurveys(submissions);
  const miles = submissions.reduce((n, s) => n + s.miles, 0);
  const mapSurveys = surveys.flatMap((s): MapSurvey[] => {
    const trail = getTrail(s.trailId);
    return trail
      ? [
          {
            id: s.id,
            trail,
            needsYou: submissionNeedsYou(s.status),
            label: `${trail.name}, ${SUBMISSION_LABEL[s.status]}`,
          },
        ]
      : [];
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarClearance(insets.bottom) + 8,
        }}
      >
        <Animated.View style={heroStyle}>
          <SurveyMap
            width={width}
            height={heroH}
            surveys={mapSurveys}
            onPress={openSurvey}
          />
        </Animated.View>

        <View style={styles.body}>
          <Pressable
            onPress={() => router.push('/prototype/account/edit')}
            accessibilityRole="button"
            accessibilityLabel={`${user.name}, volunteer since ${user.since}${miles ? `, ${miles.toFixed(1)} miles surveyed` : ''}`}
            accessibilityHint="Edit your profile"
            style={({ pressed }) => [styles.me, pressed && styles.mePressed]}
          >
            <View style={styles.avatarRing}>
              <ProfileAvatar user={user} size={AVATAR} />
            </View>
            <Text style={type.title} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              Volunteer since {user.since}
              {miles ? ` · ${miles.toFixed(1)} mi surveyed` : ''}
            </Text>
          </Pressable>

          <HowYouGoSection />

          <Section
            title="Surveys"
            variant="heading"
            gap={0}
            onPress={
              surveys.length > SURVEYS_SHOWN
                ? () => router.push('/prototype/account/surveys')
                : undefined
            }
            accessibilityHint={`See all ${surveys.length} surveys`}
          >
            {session ? <InProgress trailId={session.trailId} /> : null}
            {surveys.slice(0, SURVEYS_SHOWN).map((s, i) => (
              <SurveyRow key={s.id} sub={s} divider={i > 0 || !!session} />
            ))}
            {!surveys.length && !session ? (
              <EmptyState title="No surveys yet" style={styles.empty} />
            ) : null}
          </Section>

          {/* Nothing saved → no section (no "0 saved") */}
          {saved.length ? (
            <Section
              title="Saved"
              variant="heading"
              gap={0}
              onPress={() => router.push('/prototype/account/saved')}
              accessibilityHint="See all your saved trails"
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.bleed}
                contentContainerStyle={styles.cards}
              >
                {saved.map(id => (
                  <SavedCard key={id} trailId={id} width={CARD} />
                ))}
              </ScrollView>
            </Section>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Your name slides down in a frosted bar once it scrolls under the status bar */}
      <TitleBar title={user.name} y={y} from={heroH + 40} to={heroH + 90} />

      <RoundButton
        label="Settings"
        onPress={() => router.push('/prototype/account/settings')}
        style={{ ...styles.gear, top: barButtonTop(insets.top) }}
      >
        <Icon name="gear" size={22} color={colors.ink} strokeWidth={1.7} />
      </RoundButton>
    </View>
  );
}

/* ---------- How you go on trails ---------- */

/** The one in use, named, with its limits on one line. Picking another or adding one is a page deeper. */
function HowYouGoSection() {
  const { aids, mobility } = useAccount();
  const name = mobility ? aidName(mobility) : 'Add yours';
  const detail = mobility
    ? limitsLine(mobility)
    : 'Compare trails with your limits';
  return (
    <Section title="How you go on trails" variant="heading" gap={0}>
      <ListRow
        onPress={() => router.push(howYouGoHref(aids.length))}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${detail}`}
        accessibilityHint={
          mobility
            ? aids.length > 1
              ? 'Pick another or edit'
              : 'Edit or add another'
            : 'Trail pages compare their readings with it'
        }
      >
        <View style={styles.kind}>
          {mobility ? (
            <Icon
              name={AID_ICON[mobility.aid]}
              size={28}
              color={colors.ink}
              strokeWidth={1.6}
            />
          ) : (
            <Icon name="plus" size={24} color={colors.ink} strokeWidth={1.8} />
          )}
        </View>
        <View style={styles.flex}>
          <Text style={type.rowTitle} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[type.rowDetail, styles.rowMeta]} numberOfLines={1}>
            {detail}
          </Text>
        </View>
        <Chevron />
      </ListRow>
    </Section>
  );
}
