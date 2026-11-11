// Trail details — not in Figma yet. A system, not a poster: each section answers one question, in the
// order a person asks them, with one headline each and the details one tap deeper.
//   1. What is it?            photos (swipe, tap for full screen), status, name, park and length
//   2. Can I do it?           the key readings, compared with *how you go* (or the guideline)
//   3. Where are the tricky   the route map with a pin per flagged spot, a list that mirrors the pins,
//      parts, how do I get     and Directions into Apple Maps / Google Maps (they show time from home)
//      there?
//   4. What's at the start?   parking, restroom, water
//   5. More                   grade and surface, a row that opens its own page
// Every piece has to change what someone does next; if it's only "nice to know", it isn't here.
// No boxes except the map itself; groups are space and hairlines. Anything outside a limit says how in
// navy words ("Over your 6%"), never a warning glyph. Navy stays that rare: the route, links and icons are black.

import type { IconName } from '@/components/Icon/Icon';
import type { Anchor } from '@/components/PullDownMenu/PullDownMenu';
import type { Trail, TrailheadKey } from '@/data/trails';
import type { MapsApp } from '@/lib/directions';
import type { ComponentRef } from 'react';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { BottomBar } from '@/components/BottomBar/BottomBar';
import { GlassBackButton } from '@/components/GlassBackButton/GlassBackButton';
import { Icon } from '@/components/Icon/Icon';
import { Chevron, ListRow, Section } from '@/components/List/List';
import { PhotoCarousel } from '@/components/PhotoCarousel/PhotoCarousel';
import { PillButton } from '@/components/PillButton/PillButton';
import { PullDownMenu } from '@/components/PullDownMenu/PullDownMenu';
import { RouteMap } from '@/components/RouteMap/RouteMap';
import { GlassHeart, useSave } from '@/components/SaveHeart/SaveHeart';
import { barButtonTop, TitleBar } from '@/components/TitleBar/TitleBar';
import { StatusLabel } from '@/components/TrailStatus/TrailStatus';
import { trailPhotos } from '@/data/trail-photos';
import {
  aidFor,
  howYouGoHref,
  useAccount,
} from '@/features/account/AccountProvider';
import {
  formatElapsed,
  useElapsed,
  useSurvey,
} from '@/features/survey/SurveyProvider';
import { useLocation } from '@/features/trails/LocationProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import {
  compareReading,
  keyReadings,
  problemSpots,
  readingWord,
  splitUnit,
  trailTime,
} from '@/lib/access';
import { MAPS_APPS, openInMaps } from '@/lib/directions';
import { colors, type } from '@/styles/theme';
import styles, { SHEET } from './styles';

const HERO_HEIGHT = 340;
// What changes your trip: where to park, a restroom, whether to bring water. The sign is the survey's
// business (it's re-checked there), not a visitor's.
const TRAILHEAD: Exclude<TrailheadKey, 'sign'>[] = [
  'parking',
  'restroom',
  'water',
];

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace('/prototype/trails');

export default function TrailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTrail } = useTrails();
  const trail = getTrail(id);
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState<Anchor | null>(null);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    y.set(e.contentOffset.y);
  });

  // The photo drifts up slower than the page, and stretches when pulled down
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          y.get(),
          [-200, 0, HERO_HEIGHT],
          [-100, 0, HERO_HEIGHT / 2],
          Extrapolation.CLAMP,
        ),
      },
      { scale: interpolate(y.get(), [-200, 0], [1.5, 1], Extrapolation.CLAMP) },
    ],
  }));

  if (!trail) {
    return (
      <View style={[styles.screen, styles.missing]}>
        <Text style={styles.secondary}>
          This trail isn’t in the list anymore.
        </Text>
        <ActionButton
          label="Back to trails"
          size="large"
          onPress={() => router.replace('/prototype/trails')}
          style={styles.missingButton}
        />
      </View>
    );
  }

  const readings = keyReadings(trail);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 + insets.bottom }}
      >
        <Animated.View style={heroStyle}>
          <PhotoCarousel trail={trail} height={HERO_HEIGHT} covered={SHEET} />
        </Animated.View>

        <View style={styles.body}>
          <TitleBlock trail={trail} />
          {readings ? (
            <ForYou readings={readings} />
          ) : (
            <FirstSurvey trail={trail} />
          )}
          <MapSection trail={trail} onDirections={setMenu} />
          {trail.trailhead ? <Trailhead trail={trail} /> : null}
          <More trail={trail} hasReadings={!!readings} />
          <Credits trail={trail} />
        </View>
      </Animated.ScrollView>

      {/* The name slides down in a frosted bar once it scrolls under the status bar */}
      <TitleBar
        title={trail.name}
        y={y}
        from={HERO_HEIGHT - 40}
        to={HERO_HEIGHT + 10}
        hairline
      />

      <GlassBackButton onPress={goBack} />
      <SaveHeart trail={trail} top={barButtonTop(insets.top)} />

      <SurveyCta trail={trail} />

      {menu ? (
        <PullDownMenu<MapsApp>
          anchor={menu}
          options={MAPS_APPS}
          onChange={app => openInMaps(trail, app)}
          onClose={() => setMenu(null)}
          accessibilityLabel="Open directions in"
        />
      ) : null}
    </View>
  );
}

/* ---------- Save ---------- */

/** Across from Back. Saved trails are listed in the profile, and hearted on their cards. */
function SaveHeart({ trail, top }: { trail: Trail; top: number }) {
  const save = useSave(trail.id, trail.name);
  return <GlassHeart save={save} style={{ ...styles.save, top }} />;
}

/* ---------- 1. What is it? ---------- */

function TitleBlock({ trail }: { trail: Trail }) {
  const { mobility } = useAccount();
  return (
    <View style={styles.title}>
      <StatusLabel
        status={trail.status}
        isNew={trail.isNew}
        since={trail.last}
      />
      <Text style={[type.title, styles.name]} accessibilityRole="header">
        {trail.name}
      </Text>
      {/* What it is; how far it is from you lives with Directions, under the map */}
      <Text style={styles.secondary}>
        {trail.park} · {trail.miles} mi · {trailTime(trail, mobility)}
      </Text>
    </View>
  );
}

/* ---------- 2. Can I do it? ---------- */

type KeyReadings = NonNullable<ReturnType<typeof keyReadings>>;

/** The caption is the answer: "✓ Within limits for your chair ›" (navy ✗ "Outside…" when a reading is over),
 *  caption-sized like every other section's, so there's no extra layer between it and the numbers. It's also
 *  the link to How you go (the list of their chairs, walker…), so there's no button beside it. Under it the
 *  big numbers; the one that's over repeats the navy ✗ and says what's wrong ("✗ Too steep"), fine ones just
 *  say what they are. "Within limits", never "you can go": that's theirs to decide. Only the readings that
 *  apply to you: a cane or crutches fit any path, so no width. Nothing set: the caption is the invitation
 *  ("♿ Set how you go on trails ›", navy and a size up, since it's the one thing on the page that needs you)
 *  and the words compare with the guideline. The first time it goes straight to adding one, not to an empty list. */
function ForYou({ readings }: { readings: KeyReadings }) {
  const { aids, mobility } = useAccount();
  const items = [
    { c: readings.width, spoken: 'Narrowest width' },
    { c: readings.grade, spoken: 'Steepest grade' },
    { c: readings.cross, spoken: 'Cross slope' },
  ]
    .filter(
      ({ c }) =>
        !(c.icon === 'width' && mobility && mobility.width === undefined),
    )
    .map(it => ({ ...it, ...readingWord(it.c, mobility) }));
  const over = items.some(it => it.outside);
  return (
    <Section
      gap={32}
      title={
        mobility
          ? `${over ? 'Outside' : 'Within'} limits for ${aidFor(mobility)}`
          : 'Set how you go on trails'
      }
      lead={
        mobility ? (
          <Icon
            name={over ? 'x' : 'check'}
            size={13}
            color={over ? colors.navy : colors.ink}
            strokeWidth={2.6}
          />
        ) : (
          <Icon
            name="manualChair"
            size={20}
            color={colors.navy}
            strokeWidth={1.8}
          />
        )
      }
      invite={!mobility}
      onPress={() => router.push(howYouGoHref(aids.length))}
      accessibilityHint={
        mobility
          ? 'Change how you go on trails'
          : 'Readings are compared with the accessibility guideline until you do'
      }
    >
      <View style={styles.readings}>
        {items.map(({ c, spoken, word, outside }) => {
          const [num, unit] = splitUnit(c.value);
          const vs = compareReading(c, mobility);
          return (
            <View
              key={spoken}
              style={styles.reading}
              accessible
              accessibilityLabel={`${spoken} ${c.value}${vs ? `, ${vs.text}` : ''}`}
            >
              <Text style={styles.readingValue}>
                {num}
                <Text style={styles.readingUnit}>
                  {unit === '%' ? unit : ` ${unit}`}
                </Text>
              </Text>
              <View style={styles.word}>
                {outside ? (
                  <Icon
                    name="x"
                    size={12}
                    color={colors.navy}
                    strokeWidth={2.8}
                  />
                ) : null}
                <Text
                  style={[
                    styles.readingLabel,
                    outside && styles.readingOutside,
                  ]}
                >
                  {word}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

/** Never surveyed: say so once, and keep any notes from whoever added it. */
function FirstSurvey({ trail }: { trail: Trail }) {
  return (
    <View style={styles.first}>
      <Text style={styles.firstTitle}>No access data yet</Text>
      <Text style={styles.secondary}>Your survey will be the first.</Text>
      {trail.addedNotes ? (
        <Text style={styles.note}>“{trail.addedNotes}”</Text>
      ) : null}
    </View>
  );
}

/* ---------- 3. Where are the tricky parts, and how do I get there? ---------- */

function MapSection({
  trail,
  onDirections,
}: {
  trail: Trail;
  onDirections: (a: Anchor) => void;
}) {
  const { distanceTo } = useLocation();
  const button = useRef<ComponentRef<typeof View>>(null);
  const spots = problemSpots(trail);
  const open = () => {
    // One maps app (Android): straight there. Otherwise ask which, from the button
    if (MAPS_APPS.length === 1) return openInMaps(trail, MAPS_APPS[0].key);
    button.current?.measureInWindow((x, y, width, height) =>
      onDirections({ x, y, width, height }),
    );
  };
  return (
    <Section
      gap={16}
      title={
        spots.length
          ? `${spots.length} ${spots.length === 1 ? 'spot' : 'spots'} to know`
          : 'Map'
      }
    >
      <RouteMap trail={trail} spots={spots} />
      <View style={styles.directions}>
        <Text style={styles.distance}>{distanceTo(trail).long}</Text>
        <View ref={button} collapsable={false}>
          <PillButton
            label="Directions"
            icon={
              <Icon
                name="directions"
                size={17}
                color={colors.ink}
                strokeWidth={1.9}
              />
            }
            onPress={open}
            style={styles.directionsPill}
            accessibilityLabel="Directions to the trailhead"
          />
        </View>
      </View>
    </Section>
  );
}

/* ---------- 4. What's at the start? ---------- */

const TRAILHEAD_ICON: Record<(typeof TRAILHEAD)[number], IconName> = {
  parking: 'parking',
  restroom: 'restroom',
  water: 'water',
};
// How far each glyph sits in from its 24pt box, so its left edge lines up with the words under it
const TRAILHEAD_INSET: Record<(typeof TRAILHEAD)[number], number> = {
  parking: 4,
  restroom: 5.5,
  water: 6,
};
const TRAILHEAD_SPOKEN: Record<(typeof TRAILHEAD)[number], string> = {
  parking: 'Parking',
  restroom: 'Restroom',
  water: 'Drinking water',
};

/** Three across, like the readings. "At trailhead" under a restroom repeats the caption, so it goes. */
function Trailhead({ trail }: { trail: Trail }) {
  const th = trail.trailhead!;
  return (
    <Section title="At the trailhead" gap={24}>
      <View style={styles.readings}>
        {TRAILHEAD.map(key => {
          const item = th[key];
          const detail = item.detail === 'At trailhead' ? null : item.detail;
          return (
            <View
              key={key}
              style={styles.cell}
              accessible
              accessibilityLabel={`${TRAILHEAD_SPOKEN[key]}: ${item.value}${detail ? `, ${detail}` : ''}`}
            >
              <View style={{ marginLeft: -TRAILHEAD_INSET[key] }}>
                <Icon
                  name={TRAILHEAD_ICON[key]}
                  size={24}
                  color={colors.ink}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.cellValue}>{item.value}</Text>
              {detail ? <Text style={styles.cellDetail}>{detail}</Text> : null}
            </View>
          );
        })}
      </View>
    </Section>
  );
}

/* ---------- 5. More ---------- */

// No "Past surveys": who surveyed it, when and how many pins changed nothing anyone does here. The date
// that matters is already on the status line.
function More({ trail, hasReadings }: { trail: Trail; hasReadings: boolean }) {
  const params = { id: trail.id };
  const rows = [
    // The surface, not the gain: whether it's paved or gravel decides more than how many feet it climbs,
    // whichever way you go, and it's the one thing on that page the readings up top don't say
    hasReadings && {
      label: 'Grade and surface',
      value: surfaceOf(trail),
      onPress: () =>
        router.push({ pathname: '/prototype/trail/[id]/access', params }),
    },
  ].filter(Boolean) as { label: string; value: string; onPress: () => void }[];
  if (!rows.length) return null;
  return (
    <View style={styles.more}>
      {rows.map((r, i) => (
        <ListRow
          key={r.label}
          onPress={r.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${r.label}, ${r.value}`}
          divider={i > 0 && 'full'}
          style={styles.moreRow}
        >
          <Text style={styles.moreLabel}>{r.label}</Text>
          <Text style={styles.moreValue} numberOfLines={1}>
            {r.value}
          </Text>
          <Chevron />
        </ListRow>
      ))}
    </View>
  );
}

/** The surveyed surface ("Boardwalk, gravel") when there is one, else the trail's listed one. */
const surfaceOf = (trail: Trail) =>
  trail.conditions?.find(c => c.icon === 'surface')?.value ?? trail.surface;

/* ---------- Credits (the photo licenses ask for them) ---------- */

function Credits({ trail }: { trail: Trail }) {
  // Placeholder photos have no source, so there's no one to credit
  const photos = trailPhotos(trail.id).filter(p => p.credit.source);
  return (
    <View style={styles.credits}>
      {photos.length ? (
        <Text style={styles.credit}>
          {photos.length === 1 ? 'Photo' : 'Photos'}:{' '}
          {photos
            .map(p => `${p.credit.author} (${p.credit.license})`)
            .join(', ')}
        </Text>
      ) : null}
      <Text style={styles.credit}>Route © OpenStreetMap contributors</Text>
    </View>
  );
}

/* ---------- Start / resume ---------- */

/** Start survey, or Resume survey when one is paused on this trail. First-timers see the primer first. */
function SurveyCta({ trail }: { trail: Trail }) {
  const { session, primerSeen } = useSurvey();
  const mine = session?.trailId === trail.id ? session : null;
  const elapsed = useElapsed(mine);
  const params = { id: trail.id };
  const start = () =>
    router.push({
      pathname: primerSeen
        ? '/prototype/survey/[id]'
        : '/prototype/survey/[id]/primer',
      params,
    });
  const resume = () =>
    router.push({ pathname: '/prototype/survey/[id]/session', params });
  // Just the button: no line of small print under it. The paused time stays with the screen reader.
  return (
    <BottomBar>
      <ActionButton
        label={mine ? 'Resume survey' : 'Start survey'}
        size="large"
        accessibilityHint={
          mine
            ? `Paused at ${formatElapsed(elapsed)}, saved on this phone`
            : 'Works offline'
        }
        onPress={mine ? resume : start}
      />
    </BottomBar>
  );
}
