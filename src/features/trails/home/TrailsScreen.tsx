// Figma: Home › Trails (node 92:7222). The trail database with search, status filters and sorting.
// Not in Figma yet: the row of pull-downs under search (where distances are measured from, which
// trails, and the order). The dock (tabs, and the navy + on this tab) comes
// from the tabs layout. The controls morph with what you're doing, like iOS 26 Photos and Music:
// - Search is pinned at the top and the list scrolls under it, so it's a floating control: the same glass as the
//   dock. Under it, what the list shows is a row of tappable words, no fill: nothing there to match or clash with
//   the glass. The status filter looks like the sort: its word says what it's showing, no black capsule. It scrolls with
//   the list until it reaches the search field, then docks into that row as a glass chip ("Resurvey due ⌄")
//   while the field narrows to make room. The chip opens the same pull-down.
// - The status filter applies while searching too, so you can search within "Resurvey due".
// - No "Suggested" trail: a card that needs a survey says so on its photo, so with Nearest the closest one
//   already stands out, and moving one card out of order read as a sort bug.
// - A search that finds nothing offers "Add … as a new trail".
// The pinned row floats over a soft white fade, no frosted band, so cards dissolve as they pass under.

import type { Anchor } from '@/components/PullDownMenu/PullDownMenu';
import type { Trail, TrailStatus } from '@/data/trails';
import type { Distance } from '@/features/trails/LocationProvider';
import type { ComponentRef } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Glass } from '@/components/Glass/Glass';
import { Icon } from '@/components/Icon/Icon';
import { LocationReminder } from '@/components/LocationReminder/LocationReminder';
import { PullDownMenu } from '@/components/PullDownMenu/PullDownMenu';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import {
  SEARCH_HEIGHT,
  SearchRow,
  useDockProgress,
} from '@/components/SearchRow/SearchRow';
import { tabBarClearance } from '@/components/TabBar/TabBar';
import { TrailCard } from '@/components/TrailCard/TrailCard';
import { STATUS_LABEL } from '@/data/trails';
import { useLocation } from '@/features/trails/LocationProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import Plus from '@/icons/add.svg';
import CaretDown from '@/icons/caret-down.svg';
import { colors, GUTTER, type } from '@/styles/theme';
import styles, { CONTROLS_HEIGHT, ROW_BOTTOM } from './styles';

type Filter = 'all' | TrailStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All trails' },
  { key: 'never', label: STATUS_LABEL.never },
  { key: 'due', label: STATUS_LABEL.due },
  { key: 'current', label: STATUS_LABEL.current },
];
const FILTER_LABEL = Object.fromEntries(
  FILTERS.map(f => [f.key, f.label]),
) as Record<Filter, string>;

type Sort = 'nearest' | 'name';
const SORT_LABEL: Record<Sort, string> = { nearest: 'Nearest', name: 'Name' };
const SORTS = (Object.keys(SORT_LABEL) as Sort[]).map(key => ({
  key,
  label: SORT_LABEL[key],
}));

/** Where the pinned search row ends, from the top of the list. */
/** The row of pull-downs under search. It docks once half of it has slid under the search field. */
/** Docks this far past that line and undocks this far before it, so a slow scroll or a bounce right at it can't flicker. */
const DOCK_SLACK = 6;
/** 36 + 2×6 = a 48pt target */
const PILL_SLOP = { top: 6, bottom: 6 };
/** Inside each word's tap area; the row pulls back by this much so the first word lines up with the cards. */
/** Space kept above the first card when a change while docked jumps the list back to it. */
const FIRST_RESULT_GAP = 16;

const openTrail = (id: string) =>
  router.push({ pathname: '/prototype/trail/[id]', params: { id } });
const addTrail = (name?: string) =>
  router.push({
    pathname: '/prototype/add-trail',
    params: name ? { name } : {},
  });
const pickLocation = () => router.push('/prototype/location');

type Item = { trail: Trail; distance: Distance };

// Ask for location once per app session, the first time the list opens
let askedForLocation = false;

export default function TrailsScreen() {
  const insets = useSafeAreaInsets();
  const { trails: allTrails } = useTrails();
  const { origin, chosen, permission, locateMe, distanceTo } = useLocation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('nearest');
  const sortRef = useRef<ComponentRef<typeof View>>(null);
  const filterRef = useRef<ComponentRef<typeof View>>(null);
  const [menu, setMenu] = useState<{
    kind: 'sort' | 'filter';
    anchor: Anchor;
  } | null>(null);
  const scrollRef = useRef<FlatList<Item>>(null);

  // The filter scrolls up with the list until it meets the pinned search field, then docks beside it
  const [controlsY, setControlsY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [docked, setDocked] = useState(false);
  // The pill in the list fades out as the chip at the top fades in, and back, so the two never show at once
  const dock = useDockProgress(docked);
  const pillDock = useAnimatedStyle(() => ({
    opacity: interpolate(dock.get(), [0, 0.5], [1, 0], 'clamp'),
  }));
  // The fade under the search row only shows once something is scrolling under it
  const [scrolled, setScrolled] = useState(false);
  const edge = useSharedValue(0);
  useEffect(() => {
    edge.set(withTiming(scrolled ? 1 : 0, { duration: 160 }));
  }, [scrolled, edge]);
  const edgeStyle = useAnimatedStyle(() => ({ opacity: edge.get() }));

  const onScroll = (y: number) => {
    const line = controlsY - ROW_BOTTOM + CONTROLS_HEIGHT / 2;
    setDocked(
      was => controlsY > 0 && y >= line + (was ? -DOCK_SLACK : DOCK_SLACK),
    );
    setScrolled(y > 1);
  };

  // While docked, new results start right under the row instead of somewhere down the old list
  const toFirstResult = () => {
    if (docked)
      scrollRef.current?.scrollToOffset({
        offset: headerHeight - ROW_BOTTOM - FIRST_RESULT_GAP,
        animated: false,
      });
  };

  // New results start at the top
  const search = (text: string) => {
    setQuery(text);
    scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const chooseFilter = (f: Filter) => {
    setFilter(f);
    toFirstResult();
  };

  const everything = useMemo(
    () =>
      allTrails.map((trail): Item => ({ trail, distance: distanceTo(trail) })),
    [allTrails, distanceTo],
  );
  const q = query.trim().toLowerCase();
  const trails = useMemo(
    () =>
      everything
        .filter(
          ({ trail: t }) =>
            (filter === 'all' || t.status === filter) &&
            (!q ||
              `${t.name} ${t.park} ${t.city} ${t.county}`
                .toLowerCase()
                .includes(q)),
        )
        .sort((a, b) =>
          sort === 'nearest'
            ? a.distance.miles - b.distance.miles
            : a.trail.name.localeCompare(b.trail.name),
        ),
    [everything, q, filter, sort],
  );
  // Fake location: shows the permission alert shortly after the list first appears
  useEffect(() => {
    if (askedForLocation || chosen || permission !== 'undetermined') return;
    const timer = setTimeout(() => {
      askedForLocation = true;
      locateMe();
    }, 800);
    return () => clearTimeout(timer);
  }, [chosen, permission, locateMe]);

  const openMenu = (kind: 'sort' | 'filter', ref: typeof sortRef) =>
    ref.current?.measureInWindow((x, y, width, height) =>
      setMenu({ kind, anchor: { x, y, width, height } }),
    );
  const filtering = filter !== 'all';

  const header = (
    <View
      onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
      style={styles.header}
    >
      {/* What the list shows, as one row of pull-down pills (like Airbnb's filters): where distances are
          measured from, which trails, and the order. It scrolls sideways if a long place name needs the room */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={e => setControlsY(e.nativeEvent.layout.y)}
        style={styles.context}
        contentContainerStyle={styles.contextContent}
      >
        <Pressable
          onPress={pickLocation}
          hitSlop={PILL_SLOP}
          accessibilityRole="button"
          accessibilityLabel={`Showing trails ${origin.kind === 'device' ? `near you, in ${origin.label}` : `near ${origin.label}`}. Change location`}
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        >
          <Icon
            name={origin.kind === 'device' ? 'locate' : 'pin'}
            size={16}
            color={colors.ink}
            strokeWidth={1.8}
          />
          <Text style={[styles.pillText, styles.pillPlace]} numberOfLines={1}>
            {origin.label}
          </Text>
          <CaretDown
            color={colors.tertiary}
            strokeWidth={1.6}
            width={14}
            height={14}
          />
        </Pressable>
        {/* Once docked, the chip at the top is the filter, so this one fades away (it's under the fade) */}
        <Animated.View style={pillDock}>
          <Pressable
            ref={filterRef}
            onPress={() => openMenu('filter', filterRef)}
            disabled={docked}
            hitSlop={PILL_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`Showing ${FILTER_LABEL[filter]}. Filter by survey status`}
            accessibilityElementsHidden={docked}
            importantForAccessibility={docked ? 'no-hide-descendants' : 'auto'}
            style={({ pressed }) => [
              styles.pill,
              (pressed || menu?.kind === 'filter') && styles.pillPressed,
            ]}
          >
            {/* Same as the sort: the word says what the list shows ("Resurvey due"), no black capsule */}
            <Text style={styles.pillText} numberOfLines={1}>
              {FILTER_LABEL[filter]}
            </Text>
            <CaretDown
              color={colors.tertiary}
              strokeWidth={1.6}
              width={14}
              height={14}
            />
          </Pressable>
        </Animated.View>
        <Pressable
          ref={sortRef}
          onPress={() => openMenu('sort', sortRef)}
          hitSlop={PILL_SLOP}
          accessibilityRole="button"
          accessibilityLabel={`Sorted by ${SORT_LABEL[sort]}. Change sort`}
          style={({ pressed }) => [
            styles.pill,
            (pressed || menu?.kind === 'sort') && styles.pillPressed,
          ]}
        >
          <Icon name="sort" size={16} color={colors.ink} strokeWidth={1.8} />
          <Text style={styles.pillText}>{SORT_LABEL[sort]}</Text>
          <CaretDown
            color={colors.tertiary}
            strokeWidth={1.6}
            width={14}
            height={14}
          />
        </Pressable>
      </ScrollView>

      {/* Until there's a location, distances (and "nearby") are from a fallback place */}
      {!q && !chosen ? <LocationReminder /> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.list, { marginTop: insets.top }]}>
        <FlatList
          ref={scrollRef}
          data={trails}
          keyExtractor={item => item.trail.id}
          renderItem={({ item, index }) => <TrailRow {...item} index={index} />}
          ItemSeparatorComponent={Divider}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={type.emptyTitle}>
                {q
                  ? `No ${filtering ? `“${STATUS_LABEL[filter as TrailStatus]}” ` : ''}trails match “${query.trim()}”`
                  : filter !== 'all'
                    ? `No trails are “${STATUS_LABEL[filter]}”`
                    : 'No trails yet'}
              </Text>
              {q ? (
                <View>
                  {/* Maybe it's just the filter hiding it */}
                  {filtering ? (
                    <Pressable
                      onPress={() => setFilter('all')}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.emptyButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.emptyButtonText}>
                        Search all trails
                      </Text>
                    </Pressable>
                  ) : null}
                  {/* Can't find it? This is when people add one, so the + comes back here */}
                  <Pressable
                    onPress={() => addTrail(query.trim())}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.emptyButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Plus width={18} height={18} color={colors.navy} />
                    <Text style={styles.emptyButtonText} numberOfLines={1}>
                      Add “{query.trim()}” as a new trail
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyActions}>
                  <Pressable
                    onPress={() => setFilter('all')}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.emptyButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.emptyButtonText}>Show all trails</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => addTrail()}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.emptyButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.emptyButtonText}>Add a new trail</Text>
                  </Pressable>
                </View>
              )}
            </View>
          }
          onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={32}
          contentContainerStyle={{
            paddingBottom: tabBarClearance(insets.bottom),
            paddingHorizontal: GUTTER,
          }}
          keyboardShouldPersistTaps="handled"
          // Web blurs on any scroll in this mode, even the list re-flowing as results change
          keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Search stays put at the top; the filter docks into its row */}
      <View pointerEvents="box-none" style={[styles.top, { top: insets.top }]}>
        <Animated.View pointerEvents="none" style={[styles.edge, edgeStyle]}>
          <EdgeFade />
        </Animated.View>
        <SearchRow
          docked={docked}
          progress={dock}
          label={FILTER_LABEL[filter]}
          onOpen={anchor => setMenu({ kind: 'filter', anchor })}
          accessibilityLabel="Filter by survey status"
          style={styles.searchRow}
        >
          {/* No large title: the search field and the trails under it say what this is. Search still matches
              park, city and county names too */}
          <Glass radius={SEARCH_HEIGHT / 2} style={styles.search}>
            <View style={styles.searchClip}>
              <SearchBar
                value={query}
                onChangeText={search}
                placeholder="Search trails"
                accessibilityLabel="Search trails, parks or counties"
                containerStyle={styles.searchField}
              />
            </View>
          </Glass>
        </SearchRow>
      </View>

      {menu?.kind === 'sort' ? (
        <PullDownMenu
          anchor={menu.anchor}
          options={SORTS}
          value={sort}
          onChange={setSort}
          onClose={() => setMenu(null)}
          accessibilityLabel="Sort trails"
        />
      ) : null}
      {menu?.kind === 'filter' ? (
        <PullDownMenu
          anchor={menu.anchor}
          options={FILTERS}
          value={filter}
          onChange={chooseFilter}
          onClose={() => setMenu(null)}
          accessibilityLabel="Filter by survey status"
        />
      ) : null}
    </View>
  );
}

/**
 * iOS 26-style scroll edge: solid white at the top (continuing the status bar area), fading to clear
 * below the search row, so cards dissolve under it instead of meeting a frosted band and a hard line.
 */
function EdgeFade() {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.white} stopOpacity={1} />
          <Stop offset="0.45" stopColor={colors.white} stopOpacity={0.92} />
          <Stop offset="1" stopColor={colors.white} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#edge)" />
    </Svg>
  );
}

/** Cards are separated by space, not lines. */
function Divider() {
  return <View style={styles.gap} />;
}

function TrailRow({ trail, distance, index }: Item & { index: number }) {
  return (
    <Animated.View
      entering={FadeIn.duration(240).delay(Math.min(index, 6) * 30)}
    >
      <TrailCard
        trail={trail}
        distance={distance}
        onPress={() => openTrail(trail.id)}
      />
    </Animated.View>
  );
}
