// Location picker — not in Figma yet; styled to match the Trails list. Opens as a sheet from the
// "Near …" control under the trail search. Distances and "Nearest" sorting are measured from what you pick.
// Icons only mark actions (use my location, look up an address); places are plain text rows.

import type { Coords, Place } from '@/data/places';
import type { NativeStackNavigationProp } from 'expo-router';
import type { ComponentRef, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Icon, LocateOff } from '@/components/Icon/Icon';
import { ListRow, Section } from '@/components/List/List';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import {
  milesBetween,
  PLACES,
  searchPlaces,
  SUGGESTED_PLACE_IDS,
} from '@/data/places';
import { FAKE_LOCATION, useLocation } from '@/features/trails/LocationProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import { colors } from '@/styles/theme';
import styles from './styles';

// Address lookup uses the phone's geocoder, which web doesn't have; web can still pick a bundled place
const CAN_SEARCH_ADDRESSES = Platform.OS !== 'web';
const SUGGESTED = SUGGESTED_PLACE_IDS.map(id => PLACES.find(p => p.id === id)!);
/** "Nearby" for the trail counts under each place. */
const NEARBY_MILES = 10;

type LocateNote = 'denied' | 'unavailable' | null;
type Search = 'idle' | 'searching' | 'none' | 'error';

// Opened directly on web there's nothing to go back to
const close = () =>
  router.canGoBack() ? router.back() : router.replace('/prototype/trails');

/** County names repeat on almost every city ("Alameda County"), so only show details that tell places apart. */
const disambiguator = (p: Place) =>
  /County$/.test(p.detail) ? null : p.detail;

export default function LocationScreen() {
  const {
    origin,
    locating,
    recents,
    locateMe,
    openSettings,
    choosePlace,
    searchAddress,
  } = useLocation();
  const { trails } = useTrails();
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<LocateNote>(null);
  const [search, setSearch] = useState<Search>('idle');
  const navigation =
    useNavigation<
      NativeStackNavigationProp<Record<string, object | undefined>>
    >();
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  // Raise the keyboard once the sheet has finished sliding up. Focusing on mount (autoFocus) animates the
  // two at once, and the sheet jumps. Web has no on-screen keyboard to raise
  useEffect(() => {
    if (Platform.OS === 'web') return;
    return navigation.addListener('transitionEnd', e => {
      if (!e.data.closing) input.current?.focus();
    });
  }, [navigation]);

  const q = query.trim();
  const matches = searchPlaces(q);
  const usingDevice = origin.kind === 'device';
  const isSelected = (p: Place) =>
    origin.kind === 'place' && origin.id === p.id;

  const nearby = (at: Coords) => {
    const n = trails.filter(t => milesBetween(at, t) <= NEARBY_MILES).length;
    return n
      ? `${n} ${n === 1 ? 'trail' : 'trails'} within ${NEARBY_MILES} mi`
      : `No trails within ${NEARBY_MILES} mi`;
  };
  const placeDetail = (p: Place) =>
    [disambiguator(p), nearby(p)].filter(Boolean).join(' · ');

  const onQuery = (text: string) => {
    setQuery(text);
    setSearch('idle');
  };

  const pick = (place: Place) => {
    choosePlace(place);
    close();
  };

  const useCurrent = async () => {
    setNote(null);
    const result = await locateMe();
    if (result === 'ok') close();
    else setNote(result);
  };

  // Fake location turns it back on here; the real one leaves for Settings (result null)
  const turnOn = async () => {
    const result = await openSettings();
    if (result === 'ok') close();
    else if (result) setNote(result);
  };

  const findAddress = async () => {
    if (!q || search === 'searching') return;
    setSearch('searching');
    try {
      const place = await searchAddress(q);
      if (place) pick(place);
      else setSearch('none');
    } catch {
      setSearch('error'); // offline, or Android without location permission
    }
  };

  const submit = () => {
    if (matches.length) pick(matches[0]);
    else if (CAN_SEARCH_ADDRESSES) findAddress();
  };

  const denied = note === 'denied' && (FAKE_LOCATION || Platform.OS !== 'web');
  const deviceDetail = locating
    ? 'Finding you…'
    : note === 'unavailable'
      ? 'Couldn’t find you. Check that Location Services is on.'
      : usingDevice
        ? `${origin.label} · ${nearby(origin)}`
        : undefined;

  return (
    // No wrapping view: on iOS the sheet sizes its scroll view itself and only gets it right with the
    // header and the list side by side, and the header kept as a real view (collapsable={false}).
    // Inside a wrapper the list was stretched over the title and search bar. The background comes
    // from the stack's contentStyle
    <>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />

      <View style={styles.top} collapsable={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            Trails near…
          </Text>
          {/* Swiping the sheet down also closes it, but VoiceOver needs a button */}
          <Pressable
            onPress={close}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <SearchBar
          ref={input}
          value={query}
          onChangeText={onQuery}
          onSubmitEditing={submit}
          placeholder={
            CAN_SEARCH_ADDRESSES
              ? 'City, neighborhood or address'
              : 'Bay Area city or neighborhood'
          }
          accessibilityLabel="Search for a place"
        />
      </View>

      {/* Insets keep the last results scrollable above the keyboard */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {!q ? (
          <>
            {denied ? (
              <Row
                icon={<LocateOff size={20} color={colors.navy} />}
                title="Location is off"
                onPress={turnOn}
                trailing={
                  <View style={styles.turnOn}>
                    <Text style={styles.turnOnText}>Turn On</Text>
                  </View>
                }
              />
            ) : (
              <Row
                icon={
                  <Icon
                    name="locate"
                    size={20}
                    color={colors.navy}
                    strokeWidth={1.8}
                  />
                }
                title="Use my location"
                titleColor={colors.navy}
                detail={deviceDetail}
                selected={usingDevice && !locating && !note}
                busy={locating}
                onPress={useCurrent}
              />
            )}

            {recents.length ? (
              <Section title="Recent" gap={4} style={styles.section}>
                <View>
                  {recents.map(p => (
                    <Row
                      key={p.id}
                      title={p.name}
                      detail={placeDetail(p)}
                      selected={isSelected(p)}
                      onPress={() => pick(p)}
                    />
                  ))}
                </View>
              </Section>
            ) : null}

            <Section title="Suggested" gap={4} style={styles.section}>
              <View>
                {SUGGESTED.filter(p => !recents.some(r => r.id === p.id)).map(
                  p => (
                    <Row
                      key={p.id}
                      title={p.name}
                      detail={placeDetail(p)}
                      selected={isSelected(p)}
                      onPress={() => pick(p)}
                    />
                  ),
                )}
              </View>
            </Section>
          </>
        ) : (
          <>
            {matches.map(p => (
              <Row
                key={p.id}
                title={<Highlight text={p.name} match={q} />}
                label={p.name}
                detail={placeDetail(p)}
                selected={isSelected(p)}
                onPress={() => pick(p)}
              />
            ))}
            {CAN_SEARCH_ADDRESSES ? (
              <Row
                icon={
                  <Icon
                    name="search"
                    size={20}
                    color={colors.navy}
                    strokeWidth={1.8}
                  />
                }
                title={`Search for “${q}”`}
                titleColor={colors.navy}
                detail={
                  search === 'searching'
                    ? 'Searching…'
                    : search === 'none'
                      ? 'No place found. Try a city or a full address.'
                      : search === 'error'
                        ? 'Address search needs a connection. Pick a Bay Area city instead.'
                        : undefined
                }
                busy={search === 'searching'}
                onPress={findAddress}
              />
            ) : !matches.length ? (
              <Text style={styles.empty}>No Bay Area places match “{q}”</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

/** The part of a place name you typed, in bold — like Maps search results. */
function Highlight({ text, match }: { text: string; match: string }) {
  const at = text.toLowerCase().indexOf(match.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Text style={styles.match}>{text.slice(at, at + match.length)}</Text>
      {text.slice(at + match.length)}
    </>
  );
}

type RowProps = {
  /** Only for actions; place rows are text. */
  icon?: ReactNode;
  title: ReactNode;
  /** Spoken title when `title` isn't plain text. */
  label?: string;
  titleColor?: string;
  detail?: string;
  selected?: boolean;
  busy?: boolean;
  trailing?: ReactNode;
  onPress: () => void;
};

function Row({
  icon,
  title,
  label,
  titleColor = colors.ink,
  detail,
  selected,
  busy,
  trailing,
  onPress,
}: RowProps) {
  const spoken = label ?? (typeof title === 'string' ? title : '');
  return (
    <ListRow
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${spoken}. ${detail}` : spoken}
      accessibilityState={{ selected: !!selected, busy: !!busy }}
      style={styles.row}
    >
      {icon ? (
        <View style={styles.rowIcon}>
          {busy ? <ActivityIndicator size="small" color={colors.navy} /> : icon}
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text
          style={[styles.rowTitle, { color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {selected ? (
        <Icon name="check" size={20} color={colors.navy} strokeWidth={2.2} />
      ) : (
        trailing
      )}
    </ListRow>
  );
}
