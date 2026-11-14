import type { Coords, Place } from '@/data/places';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  DEFAULT_PLACE,
  milesBetween,
  nearestPlace,
  PLACES,
} from '@/data/places';

// Where trail distances are measured from: your phone's location, or a place you picked
// (like Beli's "near" picker). Prototype: recents are kept in memory and lost on reload.

/**
 * Prototype: skip the phone's GPS. "Use my location" opens a look-alike of the iOS permission
 * alert (src/features/trails/location-access) and, if allowed, puts you at BORP in Berkeley. Set to false
 * to use the real permission prompt and GPS.
 */
export const FAKE_LOCATION = true;
const FAKE_FIX = PLACES.find(p => p.id === 'borp')!;
const FAKE_GPS_MS = 700;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type Origin = Coords & { label: string } & (
    { kind: 'device' } | { kind: 'place'; id: string }
  );

export type LocationPermission =
  'unknown' | 'undetermined' | 'granted' | 'denied';
export type LocateResult = 'ok' | 'denied' | 'unavailable';

export type Distance = {
  miles: number;
  /** For list rows: "Here", "2.1 mi" */
  short: string;
  /** For sentences: "You’re at this trail", "2.1 mi away", "2.1 mi from Oakland" */
  long: string;
};

type LocationState = {
  origin: Origin;
  /** False while distances are still measured from the default place (nothing shared or picked yet). */
  chosen: boolean;
  permission: LocationPermission;
  locating: boolean;
  /** Your phone's last known position, if you've shared it. */
  device: Coords | null;
  recents: Place[];
  /** Asks for permission if needed, then measures from your phone's location. */
  locateMe: () => Promise<LocateResult>;
  choosePlace: (place: Place) => void;
  /** Fake location only: the answer from the permission alert. */
  answerPrompt: (allowed: boolean | null) => void;
  /** Real: opens the phone's Settings (resolves null). Fake: stands in for turning location back on there, then locates you. */
  openSettings: () => Promise<LocateResult | null>;
  /** Looks up a typed address or place (iOS/Android, needs the network). */
  searchAddress: (query: string) => Promise<Place | null>;
  distanceTo: (at: Coords) => Distance;
};

const MAX_RECENTS = 5;
const RECENT_FIX_MS = 5 * 60_000;

/** Under 10 miles to one decimal, whole miles above (Figma: trail list). */
export const formatMiles = (miles: number) =>
  `${miles < 10 ? Number(miles.toFixed(1)) : Math.round(miles)} mi`;

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [origin, setOrigin] = useState<Origin>({
    kind: 'place',
    ...DEFAULT_PLACE,
    label: DEFAULT_PLACE.name,
  });
  const [chosen, setChosen] = useState(false);
  // Fake location starts undecided, like a fresh install
  const initialPermission: LocationPermission = FAKE_LOCATION
    ? 'undetermined'
    : 'unknown';
  const [permission, setPermissionState] =
    useState<LocationPermission>(initialPermission);
  // Mirrors `permission` so a locate started right after a change sees it
  const permissionRef = useRef<LocationPermission>(initialPermission);
  const setPermission = useCallback((status: LocationPermission) => {
    permissionRef.current = status;
    setPermissionState(status);
  }, []);
  const [locating, setLocating] = useState(false);
  const [device, setDevice] = useState<Coords | null>(null);
  const [recents, setRecents] = useState<Place[]>([]);
  // Bumped by each locate or pick, so a slow GPS fix can't replace a place you picked meanwhile
  const request = useRef(0);
  // Fake location: resolves when the permission alert is answered (null = closed without answering)
  const promptAnswer = useRef<((allowed: boolean | null) => void) | null>(null);

  const applyFix = useCallback(
    (fix: Pick<Location.LocationObjectCoords, 'latitude' | 'longitude'>) => {
      const at = { lat: fix.latitude, lng: fix.longitude };
      setDevice(at);
      // Name it from the bundled list right away (works offline), then refine with the OS geocoder
      setOrigin({ kind: 'device', ...at, label: nearestPlace(at).place.name });
      setChosen(true);
      if (FAKE_LOCATION || Platform.OS === 'web') return; // reverse geocoding is iOS/Android only
      Location.reverseGeocodeAsync({ latitude: at.lat, longitude: at.lng })
        .then(([address]) => {
          const label =
            address?.city ?? address?.district ?? address?.subregion;
          // Skip if you've picked a place or moved since
          if (label)
            setOrigin(o =>
              o.kind === 'device' && o.lat === at.lat && o.lng === at.lng
                ? { ...o, label }
                : o,
            );
        })
        .catch(() => {}); // offline: keep the bundled name
    },
    [],
  );

  const answerPrompt = useCallback((allowed: boolean | null) => {
    promptAnswer.current?.(allowed);
    promptAnswer.current = null;
  }, []);

  const fakeLocate = useCallback(async (): Promise<LocateResult> => {
    let status = permissionRef.current;
    if (status !== 'granted' && status !== 'denied') {
      // Like iOS, only ask while undecided; after "Don't Allow" it's up to Settings
      promptAnswer.current?.(null);
      const answer = new Promise<boolean | null>(
        resolve => (promptAnswer.current = resolve),
      );
      router.push('/prototype/location-access');
      const allowed = await answer;
      if (allowed === null) return 'denied';
      status = allowed ? 'granted' : 'denied';
      setPermission(status);
    }
    if (status === 'denied') return 'denied';
    const id = ++request.current;
    setLocating(true);
    await wait(FAKE_GPS_MS); // long enough to see the "Finding you…" state
    if (id === request.current)
      applyFix({ latitude: FAKE_FIX.lat, longitude: FAKE_FIX.lng });
    setLocating(false);
    return 'ok';
  }, [applyFix, setPermission]);

  const locateMe = useCallback(async (): Promise<LocateResult> => {
    if (FAKE_LOCATION) return fakeLocate();
    const id = ++request.current;
    setLocating(true);
    let fixed = false;
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted')
        ({ status } = await Location.requestForegroundPermissionsAsync());
      setPermission(status);
      if (status !== 'granted') return 'denied';
      // A recent fix shows distances straight away; the fresh one replaces it
      const last = await Location.getLastKnownPositionAsync({
        maxAge: RECENT_FIX_MS,
      }).catch(() => null);
      if (last && id === request.current) {
        applyFix(last.coords);
        fixed = true;
      }
      const fresh = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (id === request.current) applyFix(fresh.coords);
      return 'ok';
    } catch {
      // e.g. Location Services turned off for the whole phone
      return fixed ? 'ok' : 'unavailable';
    } finally {
      setLocating(false);
    }
  }, [applyFix, setPermission, fakeLocate]);

  // Use your location from the start only if you've already allowed it. Otherwise we ask
  // when you tap "Use my location", so the prompt comes with a reason.
  useEffect(() => {
    if (FAKE_LOCATION) return;
    Location.getForegroundPermissionsAsync()
      .then(({ status }) => {
        setPermission(status);
        if (status === 'granted') locateMe();
      })
      .catch(() => setPermission('undetermined'));
  }, [locateMe, setPermission]);

  const openSettings = useCallback(async () => {
    if (!FAKE_LOCATION) {
      await Linking.openSettings();
      return null;
    }
    // Pretend location was switched back on in Settings
    setPermission('granted');
    return fakeLocate();
  }, [setPermission, fakeLocate]);

  const choosePlace = useCallback((place: Place) => {
    request.current++;
    setOrigin({
      kind: 'place',
      id: place.id,
      label: place.name,
      lat: place.lat,
      lng: place.lng,
    });
    setChosen(true);
    setRecents(list =>
      [place, ...list.filter(p => p.id !== place.id)].slice(0, MAX_RECENTS),
    );
  }, []);

  const searchAddress = useCallback(
    async (query: string): Promise<Place | null> => {
      const q = query.trim();
      const [hit] = await Location.geocodeAsync(q);
      if (!hit) return null;
      const at = { lat: hit.latitude, lng: hit.longitude };
      return {
        id: `search:${q.toLowerCase()}`,
        name: q,
        detail: `Near ${nearestPlace(at).place.name}`,
        ...at,
      };
    },
    [],
  );

  const distanceTo = useCallback(
    (at: Coords): Distance => {
      const miles = milesBetween(origin, at);
      if (origin.kind === 'device') {
        const here = miles < 0.05;
        return {
          miles,
          short: here ? 'Here' : formatMiles(miles),
          long: here ? 'You’re at this trail' : `${formatMiles(miles)} away`,
        };
      }
      return {
        miles,
        short: formatMiles(miles),
        long: `${formatMiles(miles)} from ${origin.label}`,
      };
    },
    [origin],
  );

  const value = useMemo(
    () => ({
      origin,
      chosen,
      permission,
      locating,
      device,
      recents,
      locateMe,
      answerPrompt,
      openSettings,
      choosePlace,
      searchAddress,
      distanceTo,
    }),
    [
      origin,
      chosen,
      permission,
      locating,
      device,
      recents,
      locateMe,
      answerPrompt,
      openSettings,
      choosePlace,
      searchAddress,
      distanceTo,
    ],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx)
    throw new Error('useLocation must be used inside <LocationProvider>');
  return ctx;
}
