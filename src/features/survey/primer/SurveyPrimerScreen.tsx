// First-time primer — not in Figma yet. Three swipeable cards shown before someone's first survey
// (and again from the ? on Get ready). Skippable: it explains, it doesn't gatekeep.

import type { PrimerCard } from '@/data/survey';
import type { ComponentRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { GlassBackButton } from '@/components/GlassBackButton/GlassBackButton';
import { Icon } from '@/components/Icon/Icon';
import { PRIMER } from '@/data/survey';
import { useSurvey } from '@/features/survey/SurveyProvider';
import { colors, type } from '@/styles/theme';
import styles from './styles';

export default function PrimerScreen() {
  // review = opened again from Get ready, so finishing goes back instead of forward
  const { id, review } = useLocalSearchParams<{
    id: string;
    review?: string;
  }>();
  const { markPrimerSeen } = useSurvey();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);
  const last = page === PRIMER.length - 1;

  const finish = () => {
    markPrimerSeen();
    if (review) router.back();
    else router.replace({ pathname: '/prototype/survey/[id]', params: { id } });
  };
  const next = () =>
    last
      ? finish()
      : pager.current?.scrollTo({ x: (page + 1) * width, animated: true });
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={styles.flex}
      >
        {PRIMER.map(card => (
          <ScrollView
            key={card.title}
            style={{ width }}
            contentContainerStyle={[
              styles.page,
              { paddingTop: insets.top + 88 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Card card={card} />
          </ScrollView>
        ))}
      </ScrollView>

      <GlassBackButton />
      {!last ? (
        <Pressable
          onPress={finish}
          hitSlop={10}
          accessibilityRole="button"
          style={[styles.skip, { top: insets.top + 14 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}

      <View
        style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`Card ${page + 1} of ${PRIMER.length}`}
        >
          {PRIMER.map((c, i) => (
            <View
              key={c.title}
              style={[styles.dot, i === page && styles.dotOn]}
            />
          ))}
        </View>
        <ActionButton
          label={last ? (review ? 'Got it' : 'Get ready') : 'Next'}
          onPress={next}
        />
      </View>
    </View>
  );
}

function Card({ card }: { card: PrimerCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.art}>
        <Icon
          name={card.icon}
          size={44}
          color={colors.navy}
          strokeWidth={1.4}
        />
      </View>
      <Text style={type.title} accessibilityRole="header">
        {card.title}
      </Text>
      <Text style={styles.body}>{card.body}</Text>
      {card.standards ? (
        <View style={styles.standards}>
          {card.standards.map((s, i) => (
            <View
              key={s.label}
              style={[styles.row, i > 0 && styles.rowDivider]}
            >
              <Icon name={s.icon} />
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
