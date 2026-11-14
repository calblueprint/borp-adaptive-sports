// Add a trail — not in Figma yet; styled to match the Trails list and the sign-up forms.
// For when a surveyor is at a trail that isn't in the database. New trails start as "Not surveyed".
// Starts with where you're standing, shown on a map: pinning it drops a pin on the map and fills in the
// city and county, so there's less to type. Then the name, and the optional details under one caption.
import type { TextInputRef } from '@/components/Field/Field';
import type { Coords } from '@/data/places';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActionButton } from '@/components/ActionButton/ActionButton';
import { MultiChips } from '@/components/Chips/Chips';
import { Field } from '@/components/Field/Field';
import { Frost } from '@/components/Glass/Glass';
import { Icon } from '@/components/Icon/Icon';
import { RoundButton } from '@/components/RoundButton/RoundButton';
import { PLACEHOLDER } from '@/data/placeholders';
import { formatCoords, nearestPlace } from '@/data/places';
import { useLocation } from '@/features/trails/LocationProvider';
import { useTrails } from '@/features/trails/TrailsProvider';
import Close from '@/icons/close.svg';
import { colors, spring } from '@/styles/theme';
import styles from './styles';

// Pick every one the trail has (no "Mixed": picking two says it). "Other" opens a field for anything not listed
const SURFACES = ['Paved', 'Boardwalk', 'Gravel', 'Packed dirt'] as const;
const OTHER = 'Other';
// Behind the ? by "Surface": what each one is underfoot or under a wheel, so people pick the same word for the same ground
const SURFACE_HELP: Record<(typeof SURFACES)[number], string> = {
  Paved: 'Asphalt or concrete. Smooth and firm, wet or dry.',
  Boardwalk:
    'Wooden planks, often raised over wet ground. Watch for gaps between boards.',
  Gravel: 'Loose small stones. Wheels can sink or skid.',
  'Packed dirt': 'Firm, packed earth. Can turn muddy or rutted after rain.',
};

/** "Boardwalk, gravel, wood chips": one line like the trail data, capital only at the start. */
function surfaceLine(picked: string[], other: string) {
  const all = [
    ...picked.filter(p => p !== OTHER),
    ...(picked.includes(OTHER) ? other.split(',') : []),
  ]
    .map(p => p.trim())
    .filter(Boolean);
  if (!all.length) return 'Not recorded';
  const line = all
    .map((p, i) => (i ? p[0].toLowerCase() + p.slice(1) : p))
    .join(', ');
  return line[0].toUpperCase() + line.slice(1);
}
const FAKE_LOCATE_MS = 1100;
// Prototype: stands in for the phone's GPS reading when you haven't shared your location
const FAKE_LOCATION: Coords = { lat: 37.8716, lng: -122.2727 };
// Prototype: an Apple Maps snapshot near Berkeley stands in for a live map centred on you
const HERE_MAP = PLACEHOLDER.mapSession;

export default function AddTrailScreen() {
  const insets = useSafeAreaInsets();
  const { addTrail } = useTrails();
  const { device } = useLocation();
  // Prefilled when you came from a search that found nothing
  const params = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(params.name ?? '');
  const [park, setPark] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [miles, setMiles] = useState('');
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [otherSurface, setOtherSurface] = useState('');
  const [notes, setNotes] = useState('');
  const [surfaceHelp, setSurfaceHelp] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<Coords | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const parkRef = useRef<TextInputRef>(null);
  const cityRef = useRef<TextInputRef>(null);
  const countyRef = useRef<TextInputRef>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const missing = [
    !name.trim() && 'a trail name',
    !city.trim() && 'a city',
    !location && 'the trailhead location',
  ].filter(Boolean) as string[];
  const ready = missing.length === 0;

  const pinLocation = () => {
    setLocating(true);
    timer.current = setTimeout(() => {
      const at = device ?? FAKE_LOCATION;
      setLocating(false);
      setLocation(at);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Fill in what we can from the nearest bundled place, without overwriting anything typed
      const { place } = nearestPlace(at);
      const inCounty = place.detail.endsWith(' County');
      setCity(c => c || (inCounty ? place.name : place.detail));
      setCounty(
        c => c || (inCounty ? place.detail.replace(/ County$/, '') : ''),
      );
    }, FAKE_LOCATE_MS);
  };

  const submit = () => {
    if (!ready || !location) return;
    const n = parseFloat(miles);
    const trail = addTrail({
      name,
      park,
      city,
      county,
      surface: surfaceLine(surfaces, otherSurface),
      miles: Number.isFinite(n) && n > 0 ? n : undefined,
      notes,
      ...location,
    });
    router.back();
    router.push({
      pathname: '/prototype/trail/[id]',
      params: { id: trail.id },
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title} accessibilityRole="header">
            Add a trail
          </Text>

          <HereMap
            location={location}
            locating={locating}
            onPin={pinLocation}
          />

          <View style={styles.fields}>
            <Field
              label="Trail name"
              value={name}
              onChangeText={setName}
              placeholder="Jewel Lake Boardwalk"
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => parkRef.current?.focus()}
            />
            <Field
              ref={parkRef}
              label="Park"
              value={park}
              onChangeText={setPark}
              placeholder="Tilden Regional Park"
              autoCapitalize="words"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => cityRef.current?.focus()}
            />
            <View style={styles.pair}>
              <Field
                ref={cityRef}
                label="City"
                containerStyle={styles.flex}
                value={city}
                onChangeText={setCity}
                placeholder="Berkeley"
                autoCapitalize="words"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => countyRef.current?.focus()}
              />
              <Field
                ref={countyRef}
                label="County"
                containerStyle={styles.flex}
                value={county}
                onChangeText={setCounty}
                placeholder="Alameda"
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Everything below can be left for the first survey */}
          <View style={styles.fields}>
            <Text style={styles.caption} accessibilityRole="header">
              Optional
            </Text>
            <View style={styles.group}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Surface</Text>
                <Pressable
                  onPress={() => setSurfaceHelp(h => !h)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="What each surface means"
                  accessibilityState={{ expanded: surfaceHelp }}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Icon
                    name="help"
                    size={18}
                    color={surfaceHelp ? colors.navy : colors.tertiary}
                    strokeWidth={1.8}
                  />
                </Pressable>
              </View>
              {surfaceHelp ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={styles.help}
                >
                  {SURFACES.map(k => (
                    <Text key={k} style={styles.helpText}>
                      <Text style={styles.helpName}>{k} </Text>
                      {SURFACE_HELP[k]}
                    </Text>
                  ))}
                </Animated.View>
              ) : null}
              <MultiChips
                options={[...SURFACES, OTHER]}
                values={surfaces}
                onChange={setSurfaces}
              />
              {surfaces.includes(OTHER) ? (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Field
                    value={otherSurface}
                    onChangeText={setOtherSurface}
                    placeholder="Sand, wood chips…"
                    accessibilityLabel="Other surface"
                    autoFocus
                    autoCapitalize="sentences"
                    returnKeyType="done"
                  />
                </Animated.View>
              ) : null}
            </View>
            <Field
              label="Length"
              value={miles}
              onChangeText={v => setMiles(v.replace(/[^\d.]/g, ''))}
              placeholder="1.5"
              keyboardType="decimal-pad"
              containerStyle={styles.half}
              right={<Text style={styles.unit}>mi</Text>}
              accessibilityLabel="Length in miles"
            />
            <View style={styles.group}>
              <Text style={styles.label}>Notes for BORP</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Where the trailhead is, how you found it…"
                placeholderTextColor={colors.tertiary}
                selectionColor={colors.selection}
                multiline
                style={styles.notes}
                accessibilityLabel="Notes for BORP"
              />
            </View>
          </View>
        </ScrollView>

        <Frost
          style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <ActionButton
            label="Add trail"
            disabled={!ready}
            accessibilityHint={
              ready
                ? 'Adds it as not surveyed'
                : `Needs ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}`
            }
            onPress={submit}
            style={styles.ctaButton}
          />
        </Frost>
      </KeyboardAvoidingView>

      <RoundButton
        label="Close"
        onPress={() => router.back()}
        style={styles.close}
      >
        <Close color={colors.stone} />
      </RoundButton>
    </View>
  );
}

/**
 * Where you're standing, on a map. Faded until you pin it; pinning pulls the veil back and drops a pin in
 * the middle, with the place and coordinates under it.
 */
function HereMap({
  location,
  locating,
  onPin,
}: {
  location: Coords | null;
  locating: boolean;
  onPin: () => void;
}) {
  const veil = useSharedValue(1);
  useEffect(() => {
    veil.set(
      withTiming(location ? 0 : 1, {
        duration: 320,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [location, veil]);
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.get() }));
  const place = location ? nearestPlace(location).place : null;

  return (
    <View style={styles.here}>
      <View
        style={styles.map}
        accessible={!!location}
        accessibilityLabel={
          location ? `Trailhead pinned near ${place?.name}` : undefined
        }
      >
        <Image
          source={HERE_MAP}
          style={styles.mapImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.veil, veilStyle]}
          pointerEvents="none"
        />
        {location ? (
          <Animated.View
            entering={ZoomIn.springify(spring.pop.duration).dampingRatio(
              spring.pop.dampingRatio,
            )}
            style={styles.pin}
            pointerEvents="none"
          >
            <View style={styles.pinHead}>
              <Icon name="pin" size={18} color={colors.white} strokeWidth={2} />
            </View>
            <View style={styles.pinTip} />
          </Animated.View>
        ) : (
          <View style={styles.mapCenter}>
            <ActionButton
              label={locating ? 'Finding you…' : 'Pin the trailhead'}
              loading={locating}
              onPress={onPin}
              style={styles.pinButton}
            />
          </View>
        )}
      </View>
      {location ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.hereRow}>
          <View style={styles.flex}>
            <Text style={styles.hereName}>Near {place?.name}</Text>
            <Text style={styles.hereCoords}>{formatCoords(location)}</Text>
          </View>
          <Pressable
            onPress={onPin}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Pin the trailhead again where you are now"
          >
            <Text style={styles.link}>Re-pin</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}
