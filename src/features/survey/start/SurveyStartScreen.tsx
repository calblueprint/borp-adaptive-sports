// Get ready (step 1 of 3) — not in Figma yet. Done at home or in the car: save the trail's map for
// offline, check gear, and see what to re-check (resurvey) or what to measure (first survey).
// The offline map is a real map preview under a white veil; downloading pulls the veil back left to
// right, so the map fills in as it saves.
import type { IconName } from '@/components/Icon/Icon';
import type { Trail } from '@/data/trails';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { Icon } from '@/components/Icon/Icon';
import { divider, Section } from '@/components/List/List';
import { PillButton } from '@/components/PillButton/PillButton';
import { RoundButton } from '@/components/RoundButton/RoundButton';
import { SurveyLayout } from '@/components/SurveyLayout/SurveyLayout';
import { TrailSnapshot } from '@/components/TrailImage/TrailImage';
import { CAPTURE, GEAR, OFFLINE_PACK_MB, recheckItems } from '@/data/survey';
import { useSurvey } from '@/features/survey/SurveyProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { colors } from '@/styles/theme';
import styles from './styles';

export default function GetReadyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trail = useTrails().getTrail(id);
  if (!trail) return null;

  return (
    <SurveyLayout
      step={1}
      title="Get ready"
      subtitle={trail.name}
      right={
        <RoundButton
          label="How surveys work"
          onPress={() =>
            router.push({
              pathname: '/prototype/survey/[id]/primer',
              params: { id, review: '1' },
            })
          }
        >
          <Icon name="help" size={24} color={colors.stone} strokeWidth={1.8} />
        </RoundButton>
      }
      cta={
        <ActionButton
          label="I’m at the trailhead"
          onPress={() =>
            router.push({
              pathname: '/prototype/survey/[id]/trailhead',
              params: { id },
            })
          }
          size="large"
        />
      }
    >
      <OfflineMap trail={trail} />
      <Gear />
      <WhatToCheck trail={trail} />
    </SurveyLayout>
  );
}

/* ---------- Offline map ---------- */

function OfflineMap({ trail }: { trail: Trail }) {
  const { offline, saveOffline } = useSurvey();
  const { status, progress } = offline(trail.id);
  const saved = status === 'saved';
  const mb = Math.round(progress * OFFLINE_PACK_MB);

  // The veil's left edge follows the download, eased between the progress ticks
  const revealed = useSharedValue(saved ? 1 : progress);
  useEffect(() => {
    revealed.set(
      withTiming(saved ? 1 : progress, {
        duration: 260,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [progress, saved, revealed]);
  const veil = useAnimatedStyle(() => ({ left: `${revealed.get() * 100}%` }));

  const detail =
    status === 'downloading'
      ? `${mb} of ${OFFLINE_PACK_MB} MB`
      : saved
        ? 'Works without signal'
        : `About ${OFFLINE_PACK_MB} MB`;

  return (
    <View style={styles.offline}>
      <View style={styles.map}>
        <TrailSnapshot trail={trail} variant="card" />
        <Animated.View style={[styles.veil, veil]} />
      </View>
      <View style={styles.offlineRow} accessibilityLiveRegion="polite">
        <View style={styles.flex}>
          <Text style={styles.offlineTitle}>
            {saved ? 'Map downloaded' : 'Offline map'}
          </Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        {status === 'none' ? (
          <PillButton
            label="Download"
            icon={
              <Icon
                name="download"
                size={17}
                color={colors.ink}
                strokeWidth={2}
              />
            }
            onPress={() => saveOffline(trail.id)}
            accessibilityLabel={`Download offline map with the last survey and guides, about ${OFFLINE_PACK_MB} megabytes`}
          />
        ) : status === 'downloading' ? (
          <ProgressRing progress={progress} />
        ) : (
          <View
            style={styles.doneMark}
            accessible
            accessibilityLabel="Downloaded"
          >
            <Icon
              name="check"
              size={18}
              color={colors.white}
              strokeWidth={2.4}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function ProgressRing({
  progress,
  size = 30,
}: {
  progress: number;
  size?: number;
}) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.navyFaint}
          strokeWidth={3}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.navy}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
        />
      </Svg>
    </View>
  );
}

/* ---------- Gear ---------- */

function Gear() {
  const [packed, setPacked] = useState<Record<string, boolean>>({});
  return (
    <Section title="Bring">
      <View>
        {GEAR.map((g, i) => {
          const on = !!packed[g.key];
          return (
            <Pressable
              key={g.key}
              onPress={() => setPacked(p => ({ ...p, [g.key]: !on }))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={
                g.detail ? `${g.label}, ${g.detail}` : g.label
              }
              style={({ pressed }) => [
                styles.row,
                i > 0 && divider,
                pressed && styles.pressed,
              ]}
            >
              <Icon
                name={g.icon}
                size={20}
                color={colors.secondary}
                strokeWidth={1.7}
              />
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, on && styles.done]}>
                  {g.label}
                </Text>
                {g.detail ? (
                  <Text style={[styles.detail, on && styles.done]}>
                    {g.detail}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.box, on && styles.boxOn]}>
                {on ? (
                  <Icon
                    name="check"
                    size={14}
                    color={colors.white}
                    strokeWidth={2.6}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

/* ---------- What to check ---------- */

function WhatToCheck({ trail }: { trail: Trail }) {
  // First survey: what to measure, with a one-line how-to each (first-timers need it)
  if (!trail.conditions) {
    return (
      <Section title="You’ll measure">
        <View>
          {CAPTURE.map((c, i) => (
            <Row
              key={c.label}
              icon={c.icon}
              title={c.label}
              detail={c.detail}
              divider={i > 0}
            />
          ))}
        </View>
      </Section>
    );
  }

  // Resurvey: the section title already says these were flagged, so no marks or explainer
  const items = recheckItems(trail);
  return (
    <Section title="Re-check first" aside={`${trail.last} survey`}>
      <View>
        {items.length ? (
          items.map((r, i) => (
            <Row
              key={r.key}
              icon={r.icon}
              title={r.label}
              detail={r.was}
              divider={i > 0}
            />
          ))
        ) : (
          <Row
            icon="check"
            title="Nothing flagged last time"
            detail="Pin anything that’s changed"
            divider={false}
          />
        )}
      </View>
    </Section>
  );
}

function Row({
  icon,
  title,
  detail,
  divider: line,
}: {
  icon: IconName;
  title: string;
  detail?: string;
  divider: boolean;
}) {
  return (
    <View
      style={[styles.row, line && divider]}
      accessible
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
    >
      <Icon name={icon} size={20} color={colors.secondary} strokeWidth={1.7} />
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}
